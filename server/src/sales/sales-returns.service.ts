import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BonusService } from '../bonus/bonus.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { ReturnSaleDto } from './dto/return-sale.dto.js';
import {
  assertRefundWithinSale,
  buildRefundPostings,
  saleMoneyPaid,
} from './lib/refund.js';
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
    private readonly stores: StoresService,
  ) {}

  async processReturn(
    caller: AuthenticatedUser,
    id: string,
    dto: ReturnSaleDto,
  ): Promise<SaleView> {
    const storeId = await this.stores.currentStoreId();
    const sale = await this.reads.findSaleForReturn(id, storeId);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    await this.assertNotBoughtBack(sale);

    const refundPostings = await this.cappedPostings(caller, id, sale, dto);
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
      return this.require(id, storeId);
    }

    const device = await this.reads.findDeviceState(sale.deviceId, storeId);
    if (!device) throw new NotFoundException(`Sale ${id} device missing`);
    await this.checkout.processReturn(
      {
        ...base,
        deviceId: sale.deviceId,
        expectedVersion: dto.expectedVersion ?? device.version,
      },
      reverseBonus,
    );
    return this.require(id, storeId);
  }

  /**
   * A unit we have since bought back is in stock again (maybe re-sold); its old
   * sale can no longer be returned (ADR 0044). Its warranty ended at buy-back.
   */
  private async assertNotBoughtBack(sale: {
    deviceId: string | null;
    soldAt: Date;
  }): Promise<void> {
    if (!sale.deviceId) return;
    if (
      await this.purchases.wasUnitBoughtBackAfter(sale.deviceId, sale.soldAt)
    ) {
      throw new ConflictException({
        message:
          'This unit was bought back; the sale can no longer be returned',
        code: 'SALE_UNIT_BOUGHT_BACK',
      });
    }
  }

  /**
   * Cap the refund at the sale's money paid + trade-in value (ADR 0028/0039),
   * then split it per account. The part above the money actually paid (the
   * trade-in part, refunded in cash) needs `purchase.create` — a plain cashier
   * may refund only what the sale took in (security fix); above that → 403.
   */
  private async cappedPostings(
    caller: AuthenticatedUser,
    id: string,
    sale: { salePrice: Prisma.Decimal; creditId: string | null },
    dto: ReturnSaleDto,
  ): Promise<SalePayment[]> {
    const saleNets = (await this.ledger.salePayments([id])).get(id) ?? [];
    const tradeInTotal = await this.purchases.tradeInTotalForSale(id);
    const isCredit = sale.creditId !== null;
    assertRefundWithinSale(
      dto.refundAmount,
      sale.salePrice,
      saleNets,
      isCredit,
      tradeInTotal,
    );
    const paid = saleMoneyPaid(sale.salePrice, saleNets, isCredit);
    if (
      !caller.permissions.has('purchase.create') &&
      new Prisma.Decimal(dto.refundAmount).greaterThan(paid)
    ) {
      throw new ForbiddenException({
        message:
          'Refunding the trade-in part needs the purchase.create permission',
        code: 'TRADE_IN_REFUND_FORBIDDEN',
      });
    }
    return buildRefundPostings(dto.refundAmount, saleNets);
  }

  private async require(id: string, storeId: string): Promise<SaleView> {
    const view = await this.reads.findById(id, [storeId]);
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
