import { ConflictException, Injectable } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from '../stock/stock.service.js';
import type {
  CheckoutInput,
  QuantityCheckoutInput,
  ReturnInput,
  SalePayment,
} from './types/sale.types.js';

type Tx = PrismaTx;

/**
 * Atomic device-status writes that accompany a sale. Every method runs in one
 * `$transaction` and advances `devices.version` under an optimistic-lock guard
 * (409 on mismatch), appending a `device_status_history` row. The SALE/REFUND
 * ledger rows are posted in the same transaction so money and sale commit as one.
 *
 * Cross-module note: the device + history writes below are owned by inventory.
 * They live here only for checkout atomicity; route them through
 * `DevicesService.changeStatus` after the wave-2 merge (see README).
 */
@Injectable()
export class SalesCheckoutRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly stock: StockService,
  ) {}

  /**
   * Creates the sale, marks the device SOLD, opens the warranty, posts SALE
   * rows. Runs in `outer` when a caller (a credit cart) needs this to be part
   * of its own transaction; otherwise it opens its own (ADR 0035).
   */
  async checkout(input: CheckoutInput, outer?: Tx): Promise<string> {
    const run = (tx: Tx) => this.doCheckout(tx, input);
    return outer ? run(outer) : this.prisma.$transaction(run);
  }

  private async doCheckout(tx: Tx, input: CheckoutInput): Promise<string> {
    const customerId = await this.resolveCustomer(tx, input);
    await this.advanceDevice(
      tx,
      input.deviceId,
      input.expectedVersion,
      'IN_STOCK',
      'SOLD',
      input.soldById,
      'sale',
    );
    const sale = await tx.sale.create({
      data: {
        storeId: input.storeId,
        deviceId: input.deviceId,
        customerId,
        creditId: input.creditId,
        soldById: input.soldById,
        salePrice: input.salePrice,
        landedCostSnapshot: input.landedCostSnapshot,
        listPriceSnapshot: input.listPriceSnapshot,
        priceLevelCode: input.priceLevelCode,
        soldAt: input.soldAt,
        notes: input.notes,
        clientMutationId: input.clientMutationId,
        warranty: { create: input.warranty },
      },
      select: { id: true },
    });
    await this.postSalePayments(tx, input, sale.id);
    return sale.id;
  }

  /** One SALE ledger row per tender line (shared by unit + quantity checkout). */
  private async postSalePayments(
    tx: Tx,
    input: {
      storeId: string;
      soldById: string;
      soldAt: Date;
      payments: SalePayment[];
    },
    saleId: string,
  ): Promise<void> {
    for (const p of input.payments) {
      await this.ledger.post(
        {
          storeId: input.storeId,
          accountCode: p.accountCode,
          typeCode: 'SALE',
          amount: p.amount,
          occurredAt: input.soldAt,
          saleId,
          createdById: input.soldById,
        },
        tx,
      );
    }
  }

  /**
   * A quantity sale: one Sale row with no device, a SALE stock movement at the
   * moving-average cost computed inside this transaction, and the SALE ledger
   * rows. `landedCostSnapshot = quantity × average` so profit means the same
   * everywhere. No warranty. Stock may go below zero — nothing is blocked.
   */
  async checkoutQuantity(
    input: QuantityCheckoutInput,
    outer?: Tx,
  ): Promise<string> {
    const run = (tx: Tx) => this.doCheckoutQuantity(tx, input);
    return outer ? run(outer) : this.prisma.$transaction(run);
  }

  private async doCheckoutQuantity(
    tx: Tx,
    input: QuantityCheckoutInput,
  ): Promise<string> {
    const customerId = await this.resolveCustomer(tx, input);
    const unitCost = await this.stock.averageCost(
      input.storeId,
      input.modelId,
      tx,
    );
    const sale = await tx.sale.create({
      data: {
        storeId: input.storeId,
        modelId: input.modelId,
        quantity: input.quantity,
        customerId,
        creditId: input.creditId,
        soldById: input.soldById,
        salePrice: input.salePrice,
        landedCostSnapshot: unitCost.times(input.quantity),
        listPriceSnapshot: input.listPriceSnapshot,
        priceLevelCode: input.priceLevelCode,
        soldAt: input.soldAt,
        notes: input.notes,
        clientMutationId: input.clientMutationId,
      },
      select: { id: true },
    });
    await this.stock.postMovement(
      {
        storeId: input.storeId,
        modelId: input.modelId,
        typeCode: 'SALE',
        quantity: -input.quantity,
        unitCostSnapshot: unitCost,
        saleId: sale.id,
        createdById: input.soldById,
        occurredAt: input.soldAt,
      },
      tx,
    );
    await this.postSalePayments(tx, input, sale.id);
    return sale.id;
  }

  /**
   * Records a return and posts REFUND rows (money out). A unit sale moves the
   * device back; a quantity sale (`quantityRestore` set) posts a RETURN stock
   * movement at the sale's own unit cost instead.
   */
  async processReturn(input: ReturnInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.saleReturn.findUnique({
        where: { saleId: input.saleId },
        select: { saleId: true },
      });
      if (existing) {
        throw new ConflictException('This sale has already been returned');
      }
      if (input.quantityRestore) {
        const r = input.quantityRestore;
        await this.stock.postMovement(
          {
            storeId: input.storeId,
            modelId: r.modelId,
            typeCode: 'RETURN',
            quantity: r.quantity,
            unitCostSnapshot: r.unitCost,
            saleId: input.saleId,
            createdById: input.processedById,
          },
          tx,
        );
      } else {
        await this.advanceDevice(
          tx,
          input.deviceId!,
          input.expectedVersion,
          null,
          input.toStatusCode,
          input.processedById,
          'warranty return',
        );
      }
      await tx.saleReturn.create({
        data: {
          saleId: input.saleId,
          refundAmount: input.refundAmount,
          reason: input.reason,
          processedById: input.processedById,
        },
      });
      await this.postRefunds(tx, input);
    });
  }

  /** One REFUND ledger row (money out) per refund posting. */
  private async postRefunds(tx: Tx, input: ReturnInput): Promise<void> {
    for (const r of input.refundPostings) {
      await this.ledger.post(
        {
          storeId: input.storeId,
          accountCode: r.accountCode,
          typeCode: 'REFUND',
          amount: r.amount.negated(),
          saleId: input.saleId,
          createdById: input.processedById,
        },
        tx,
      );
    }
  }

  private async resolveCustomer(
    tx: Tx,
    input: {
      customerId?: string;
      inlineCustomer?: { name: string; phone?: string };
    },
  ): Promise<string | undefined> {
    if (input.customerId) return input.customerId;
    const inline = input.inlineCustomer;
    if (!inline) return undefined;
    if (inline.phone) {
      const c = await tx.customer.upsert({
        where: { phone: inline.phone },
        update: { name: inline.name },
        create: { name: inline.name, phone: inline.phone },
        select: { id: true },
      });
      return c.id;
    }
    const c = await tx.customer.create({
      data: { name: inline.name },
      select: { id: true },
    });
    return c.id;
  }

  private async advanceDevice(
    tx: Tx,
    deviceId: string,
    expectedVersion: number,
    fromStatusCode: string | null,
    toStatusCode: string,
    changedById: string,
    reason: string,
  ): Promise<void> {
    const where =
      fromStatusCode === null
        ? { id: deviceId, version: expectedVersion }
        : {
            id: deviceId,
            version: expectedVersion,
            statusCode: fromStatusCode,
          };
    const updated = await tx.device.updateMany({
      where,
      data: { statusCode: toStatusCode, version: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictException(
        'Device changed since it was read; reload and retry',
      );
    }
    await tx.deviceStatusHistory.create({
      data: {
        deviceId,
        fromStatusCode: fromStatusCode ?? 'SOLD',
        toStatusCode,
        changedById,
        reason,
      },
    });
  }
}
