import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ReturnSaleDto } from './dto/return-sale.dto.js';
import { assertRefundWithinSale, buildRefundPostings } from './lib/refund.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import type { SaleView } from './types/sale.types.js';

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
  ) {}

  async processReturn(
    caller: AuthenticatedUser,
    id: string,
    dto: ReturnSaleDto,
  ): Promise<SaleView> {
    const sale = await this.reads.findSaleForReturn(id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);

    const saleNets = (await this.ledger.salePayments([id])).get(id) ?? [];
    assertRefundWithinSale(dto.refundAmount, sale.salePrice, saleNets);
    const refundPostings = buildRefundPostings(dto.refundAmount, saleNets);

    if (sale.deviceId === null) {
      const unitCost = sale.landedCostSnapshot.div(sale.quantity!);
      await this.checkout.processReturn({
        saleId: id,
        deviceId: null,
        expectedVersion: 0,
        toStatusCode: dto.deviceToStatusCode,
        refundAmount: dto.refundAmount,
        reason: dto.reason,
        processedById: caller.id,
        storeId: sale.storeId,
        refundPostings,
        quantityRestore: {
          modelId: sale.modelId!,
          quantity: sale.quantity!,
          unitCost,
        },
      });
      return this.require(id);
    }

    const device = await this.reads.findDeviceState(sale.deviceId);
    if (!device) throw new NotFoundException(`Sale ${id} device missing`);
    await this.checkout.processReturn({
      saleId: id,
      deviceId: sale.deviceId,
      expectedVersion: dto.expectedVersion ?? device.version,
      toStatusCode: dto.deviceToStatusCode,
      refundAmount: dto.refundAmount,
      reason: dto.reason,
      processedById: caller.id,
      storeId: sale.storeId,
      refundPostings,
    });
    return this.require(id);
  }

  private async require(id: string): Promise<SaleView> {
    const view = await this.reads.findById(id);
    if (!view) throw new NotFoundException(`Sale ${id} not found`);
    const payments = (await this.ledger.salePayments([id])).get(id) ?? [];
    return { ...view, payments };
  }
}
