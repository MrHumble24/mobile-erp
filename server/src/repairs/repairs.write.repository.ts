import { Injectable } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateTicketData {
  storeId: string;
  customerId: string;
  deviceName: string;
  modelId?: string;
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
 * part and its ledger / stock row commit atomically. */
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

  updateDetails(id: string, data: UpdateTicketData): Promise<unknown> {
    return this.prisma.repair.update({ where: { id }, data });
  }

  /** Move the ticket and append the audit row, atomically. */
  async changeStatus(
    tx: PrismaTx,
    id: string,
    from: string,
    to: string,
    changedById: string,
    note?: string,
  ): Promise<void> {
    await tx.repair.update({ where: { id }, data: { statusCode: to } });
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
  ): Promise<string> {
    const part = await tx.repairPart.create({ data, select: { id: true } });
    return part.id;
  }

  async deletePart(tx: PrismaTx, id: string): Promise<void> {
    await tx.repairPart.delete({ where: { id } });
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
  ): Promise<string> {
    const payment = await tx.repairPayment.create({
      data,
      select: { id: true },
    });
    return payment.id;
  }
}
