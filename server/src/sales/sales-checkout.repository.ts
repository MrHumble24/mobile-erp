import { ConflictException, Injectable } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CheckoutInput, ReturnInput } from './types/sale.types.js';

type Tx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

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
  ) {}

  /** Creates the sale, marks the device SOLD, opens the warranty, posts SALE rows. */
  async checkout(input: CheckoutInput): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
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
          soldById: input.soldById,
          salePrice: input.salePrice,
          landedCostSnapshot: input.landedCostSnapshot,
          soldAt: input.soldAt,
          notes: input.notes,
          clientMutationId: input.clientMutationId,
          warranty: { create: input.warranty },
        },
        select: { id: true },
      });
      for (const p of input.payments) {
        await this.ledger.post(
          {
            storeId: input.storeId,
            accountCode: p.accountCode,
            typeCode: 'SALE',
            amount: p.amount,
            occurredAt: input.soldAt,
            saleId: sale.id,
            createdById: input.soldById,
          },
          tx,
        );
      }
      return sale.id;
    });
  }

  /** Records a return, moves the device, and posts REFUND rows (money out). */
  async processReturn(input: ReturnInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.saleReturn.findUnique({
        where: { saleId: input.saleId },
        select: { saleId: true },
      });
      if (existing) {
        throw new ConflictException('This sale has already been returned');
      }
      await this.advanceDevice(
        tx,
        input.deviceId,
        input.expectedVersion,
        null,
        input.toStatusCode,
        input.processedById,
        'warranty return',
      );
      await tx.saleReturn.create({
        data: {
          saleId: input.saleId,
          refundAmount: input.refundAmount,
          reason: input.reason,
          processedById: input.processedById,
        },
      });
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
    });
  }

  private async resolveCustomer(
    tx: Tx,
    input: CheckoutInput,
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
