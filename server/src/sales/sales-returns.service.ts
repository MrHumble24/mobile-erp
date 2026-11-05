import { Injectable, NotFoundException } from '@nestjs/common';
import { BonusService } from '../bonus/bonus.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ReturnSaleDto } from './dto/return-sale.dto.js';
import { assertRefundWithinSale, buildRefundPostings } from './lib/refund.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import type { SalePayment, SaleView } from './types/sale.types.js';

/**
 * Warranty returns and refunds (ADR 0028). Split from checkout so each service
 * has one reason to change. The refund is capped at the sale's net SALE ledger
 * total; REFUND rows post in proportion inside the return transaction.
 */
@Injectable()
export class SalesReturnsService {
  constructor(
    private readonly reads: SalesRepository,
    private readonly checkout: SalesCheckoutRepository,
    private readonly ledger: LedgerService,
    private readonly purchases: CustomerPurchasesService,
    private readonly bonus: BonusService,
  ) {}

  async processReturn(
    caller: AuthenticatedUser,
    id: string,
    dto: ReturnSaleDto,
  ): Promise<SaleView> {
    const sale = await this.reads.findSaleForReturn(id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);

    const refundPostings = await this.cappedPostings(id, sale, dto);
    // A return takes back points earned and gives back points spent (ADR 0043),
    // in the same transaction as the refund.
    const reverseBonus = (tx: Prisma.TransactionClient) =>
      this.bonus.reverseForSale(tx, id, caller.id);
    const base = {
      saleId: id,
      toStatusCode: dto.deviceToStatusCode,
      refundAmount: dto.refundAmount,
      reason: dto.reason,
      processedById: caller.id,
      storeId: sale.storeId,
      refundPostings,
    };

    if (sale.deviceId === null) {
      await this.checkout.processReturn(
        {
          ...base,
          deviceId: null,
          expectedVersion: 0,
          quantityRestore: {
            modelId: sale.modelId!,
            quantity: sale.quantity!,
            unitCost: sale.landedCostSnapshot.div(sale.quantity!),
          },
        },
        reverseBonus,
      );
      return this.require(id);
    }

    const device = await this.reads.findDeviceState(sale.deviceId);
    if (!device) throw new NotFoundException(`Sale ${id} device missing`);
    await this.checkout.processReturn(
      {
        ...base,
        deviceId: sale.deviceId,
        expectedVersion: dto.expectedVersion ?? device.version,
      },
      reverseBonus,
    );
    return this.require(id);
  }

  /**
   * Cap the refund at the sale's net SALE rows (or salePrice when there are
   * none) plus its trade-in value (ADR 0028/0039), then split it per account.
   */
  private async cappedPostings(
    id: string,
    sale: { salePrice: Prisma.Decimal; creditId: string | null },
    dto: ReturnSaleDto,
  ): Promise<SalePayment[]> {
    const saleNets = (await this.ledger.salePayments([id])).get(id) ?? [];
    const tradeInTotal = await this.purchases.tradeInTotalForSale(id);
    assertRefundWithinSale(
      dto.refundAmount,
      sale.salePrice,
      saleNets,
      sale.creditId !== null,
      tradeInTotal,
    );
    return buildRefundPostings(dto.refundAmount, saleNets);
  }

  private async require(id: string): Promise<SaleView> {
    const view = await this.reads.findById(id);
    if (!view) throw new NotFoundException(`Sale ${id} not found`);
    const [payments, tradeIns, bonus] = await Promise.all([
      this.ledger.salePayments([id]),
      this.purchases.tradeInsBySale([id]),
      this.bonus.summaryBySale([id]),
    ]);
    return {
      ...view,
      payments: payments.get(id) ?? [],
      tradeIns: tradeIns.get(id) ?? [],
      bonus: bonus.get(id) ?? { earned: '0.00', spent: '0.00' },
    };
  }
}
