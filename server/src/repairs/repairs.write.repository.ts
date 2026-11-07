import { ConflictException, Injectable } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** The code clients watch for when a concurrent write beat us to this ticket. */
export const REPAIR_VERSION_CONFLICT = 'REPAIR_VERSION_CONFLICT';

export interface CreateTicketData {
  storeId: string;
  customerId: string;
  deviceName: string;
  modelId?: string;
  deviceId?: string;
  imei?: string;
  serialNumber?: string;
  problem: string;
  agreedPrice: Prisma.Decimal;
  warrantyDays: number;
  notes?: string;
  masterUserId?: string;
  outsideMasterName?: string;
  outsideMasterPhone?: string;
  outsideCost?: Prisma.Decimal;
  receivedById: string;
  receivedAt: Date;
}

export interface UpdateTicketData {
  deviceName?: string;
  modelId?: string | null;
  deviceId?: string | null;
  imei?: string | null;
  serialNumber?: string | null;
  problem?: string;
  agreedPrice?: Prisma.Decimal;
  warrantyDays?: number;
  notes?: string | null;
  masterUserId?: string | null;
  outsideMasterName?: string | null;
  outsideMasterPhone?: string | null;
  outsideCost?: Prisma.Decimal | null;
}

/** Prisma writes for repairs. The service drives the transaction so a payment /
 * part and its ledger / stock row commit atomically. Every write bumps the
 * ticket `version` under an optimistic-lock guard. */
@Injectable()
export class RepairsWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /** The next sequential ticket number for a store (1-based). */
  async nextTicketNumber(tx: PrismaTx, storeId: string): Promise<number> {
    const { _max } = await tx.repair.aggregate({
      where: { storeId },
      _max: { ticketNumber: true },
    });
    return (_max.ticketNumber ?? 0) + 1;
  }

  /** Create the ticket with its first (RECEIVED) status-history row. */
  async createTicket(
    tx: PrismaTx,
    ticketNumber: number,
    data: CreateTicketData,
  ): Promise<string> {
    const repair = await tx.repair.create({
      data: {
        ...data,
        ticketNumber,
        statusCode: 'RECEIVED',
        statusHistory: {
          create: {
            toStatusCode: 'RECEIVED',
            changedById: data.receivedById,
          },
        },
      },
      select: { id: true },
    });
    return repair.id;
  }

  /**
   * Optimistic lock: bump `version` (and apply any repair-row data) only while
   * the row still has the version the caller read. A zero count means another
   * write committed first — refuse so no overpay / illegal status move slips in.
   */
  async bumpVersion(
    tx: PrismaTx,
    id: string,
    expectedVersion: number,
    data: Prisma.RepairUncheckedUpdateManyInput = {},
  ): Promise<void> {
    const { count } = await tx.repair.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (count === 0) {
      throw new ConflictException({
        code: REPAIR_VERSION_CONFLICT,
        message: 'The repair changed concurrently; reload the ticket and retry',
      });
    }
  }

  /** Edit the ticket's own fields, guarded by its version. */
  async updateDetails(
    tx: PrismaTx,
    id: string,
    data: UpdateTicketData,
    expectedVersion: number,
  ): Promise<void> {
    await this.bumpVersion(tx, id, expectedVersion, data);
  }

  /** Move the ticket and append the audit row, atomically (guarded). */
  async changeStatus(
    tx: PrismaTx,
    id: string,
    from: string,
    to: string,
    changedById: string,
    note: string | undefined,
    expectedVersion: number,
  ): Promise<void> {
    await this.bumpVersion(tx, id, expectedVersion, { statusCode: to });
    await tx.repairStatusHistory.create({
      data: {
        repairId: id,
        fromStatusCode: from,
        toStatusCode: to,
        changedById,
        note,
      },
    });
  }

  async createPart(
    tx: PrismaTx,
    data: {
      repairId: string;
      modelId: string;
      quantity: number;
      unitCostSnapshot: Prisma.Decimal;
      addedById: string;
    },
    expectedVersion: number,
  ): Promise<string> {
    await this.bumpVersion(tx, data.repairId, expectedVersion);
    const part = await tx.repairPart.create({ data, select: { id: true } });
    return part.id;
  }

  async deletePart(
    tx: PrismaTx,
    partId: string,
    repairId: string,
    expectedVersion: number,
  ): Promise<void> {
    await this.bumpVersion(tx, repairId, expectedVersion);
    await tx.repairPart.delete({ where: { id: partId } });
  }

  async createPayment(
    tx: PrismaTx,
    data: {
      repairId: string;
      accountCode: string;
      amount: Prisma.Decimal;
      receivedById: string;
      occurredAt: Date;
    },
    expectedVersion: number,
  ): Promise<string> {
    await this.bumpVersion(tx, data.repairId, expectedVersion);
    const payment = await tx.repairPayment.create({
      data,
      select: { id: true },
    });
    return payment.id;
  }

  /** The ticket a client mutation key already produced, for replay / dedupe. */
  async findMutationRepairId(key: string): Promise<string | null> {
    const row = await this.prisma.repairMutation.findUnique({
      where: { clientMutationId: key },
      select: { repairId: true },
    });
    return row?.repairId ?? null;
  }

  /** Insert a mutation key inside the write's transaction; a duplicate (P2002)
   * is left to propagate so the service can replay the committed ticket. */
  async recordMutation(
    tx: PrismaTx,
    key: string,
    repairId: string,
    kind: string,
  ): Promise<void> {
    await tx.repairMutation.create({
      data: { clientMutationId: key, repairId, kind },
    });
  }
}
