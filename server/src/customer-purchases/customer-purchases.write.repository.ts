import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { computeLandedCost } from '../devices/lib/landed-cost.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CustomerPurchaseInput,
  CustomerPurchaseResult,
} from './types/customer-purchase.types.js';

/**
 * The single write path for a unit bought from a customer (ADR 0039), shared by
 * the plain-purchase endpoint and a sale's trade-in. In one transaction it
 * creates the unit in stock (cost = price paid, no customs/shipment), its
 * IN_STOCK status-history row, the purchase document, and — for a plain
 * purchase (`ledgerAccountCode` set) — one CUSTOMER_PURCHASE ledger row (money
 * out). A trade-in posts no ledger row: its value netted the sale total.
 */
@Injectable()
export class CustomerPurchasesWriteRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  create(
    input: CustomerPurchaseInput,
    outer?: PrismaTx,
  ): Promise<CustomerPurchaseResult> {
    const run = (tx: PrismaTx) => this.doCreate(tx, input);
    return outer ? run(outer) : this.prisma.$transaction(run);
  }

  private async doCreate(
    tx: PrismaTx,
    input: CustomerPurchaseInput,
  ): Promise<CustomerPurchaseResult> {
    const price = new Prisma.Decimal(input.pricePaid);
    const landedCost = computeLandedCost(price.toNumber(), 0, 0);
    const device = await this.createDevice(tx, input, landedCost);
    const purchase = await tx.customerPurchase.create({
      data: {
        storeId: input.storeId,
        customerId: input.customerId,
        deviceId: device.id,
        pricePaid: price,
        saleId: input.saleId,
        createdById: input.createdById,
        occurredAt: input.occurredAt,
      },
      select: { id: true },
    });
    if (input.ledgerAccountCode) {
      await this.ledger.post(
        {
          storeId: input.storeId,
          accountCode: input.ledgerAccountCode,
          typeCode: 'CUSTOMER_PURCHASE',
          amount: price.negated(),
          occurredAt: input.occurredAt,
          deviceId: device.id,
          customerPurchaseId: purchase.id,
          createdById: input.createdById,
        },
        tx,
      );
    }
    return { purchaseId: purchase.id, deviceId: device.id };
  }

  private async createDevice(
    tx: PrismaTx,
    input: CustomerPurchaseInput,
    landedCost: string,
  ): Promise<{ id: string }> {
    const { unit } = input;
    try {
      return await tx.device.create({
        data: {
          imei: unit.imei ?? null,
          imei2: unit.imei2 ?? null,
          serialNumber: unit.serialNumber ?? null,
          storeId: input.storeId,
          shipmentId: null,
          modelId: unit.modelId,
          specs: (unit.specs ?? {}) as Prisma.InputJsonValue,
          acquisitionCost: input.pricePaid,
          customsFee: 0,
          unitExpense: 0,
          landedCost,
          statusCode: 'IN_STOCK',
          statusHistory: {
            create: {
              toStatusCode: 'IN_STOCK',
              changedById: input.createdById,
            },
          },
        },
        select: { id: true },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'A unit with this IMEI or serial number already exists',
        );
      }
      throw error;
    }
  }
}
