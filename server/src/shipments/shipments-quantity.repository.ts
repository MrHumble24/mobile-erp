import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from '../stock/stock.service.js';
import type {
  PurchaseLineInput,
  PurchasedLineView,
} from '../stock/types/stock.types.js';

/**
 * Quantity purchase into a shipment (ADR 0030). Each line writes a PURCHASE
 * stock movement and posts one PURCHASE ledger row (quantity × unit cost, money
 * out) from the shipment's own store and payment account, all in one
 * transaction. Mirrors the per-device intake path for IMEI/serial units.
 */
@Injectable()
export class ShipmentsQuantityRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly stock: StockService,
  ) {}

  async purchase(
    shipmentId: string,
    items: PurchaseLineInput[],
    userId: string,
  ): Promise<PurchasedLineView[]> {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUniqueOrThrow({
        where: { id: shipmentId },
        select: { storeId: true, paymentAccountCode: true },
      });
      const out: PurchasedLineView[] = [];
      for (const item of items) {
        const unitCost = new Prisma.Decimal(item.unitCost);
        await this.stock.postMovement(
          {
            storeId: shipment.storeId,
            modelId: item.modelId,
            typeCode: 'PURCHASE',
            quantity: item.quantity,
            unitCostSnapshot: unitCost,
            shipmentId,
            createdById: userId,
          },
          tx,
        );
        const amount = unitCost.times(item.quantity);
        if (amount.gt(0)) {
          await this.ledger.post(
            {
              storeId: shipment.storeId,
              accountCode: shipment.paymentAccountCode,
              typeCode: 'PURCHASE',
              amount: amount.negated(),
              shipmentId,
              createdById: userId,
            },
            tx,
          );
        }
        out.push({
          modelId: item.modelId,
          quantity: item.quantity,
          unitCost: unitCost.toFixed(2),
        });
      }
      return out;
    });
  }
}
