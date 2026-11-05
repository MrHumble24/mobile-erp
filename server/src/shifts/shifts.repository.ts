import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ShiftListFilter } from './types/shift.types.js';

type Tx = Prisma.TransactionClient;

const CASHIER_INCLUDE = {
  cashier: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ShiftInclude;

export type ShiftRow = Prisma.ShiftGetPayload<{
  include: typeof CASHIER_INCLUDE;
}>;

/** All Prisma access for shifts. */
@Injectable()
export class ShiftsRepository {
  constructor(private readonly prisma: PrismaService) {}

  runInTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findOpenByCashier(cashierId: string): Promise<ShiftRow | null> {
    return this.prisma.shift.findFirst({
      where: { cashierId, closedAt: null },
      include: CASHIER_INCLUDE,
    });
  }

  findById(id: string): Promise<ShiftRow | null> {
    return this.prisma.shift.findUnique({
      where: { id },
      include: CASHIER_INCLUDE,
    });
  }

  open(
    storeId: string,
    cashierId: string,
    openingCount: Prisma.Decimal,
  ): Promise<ShiftRow> {
    return this.prisma.shift.create({
      data: { storeId, cashierId, openingCount },
      include: CASHIER_INCLUDE,
    });
  }

  /** Close a still-open shift inside the caller's transaction. Returns 0 rows if
   * it was already closed (a race), so the service can reject. */
  close(
    tx: Tx,
    id: string,
    closedAt: Date,
    closingCount: Prisma.Decimal,
    note: string | undefined,
  ): Promise<{ count: number }> {
    return tx.shift.updateMany({
      where: { id, closedAt: null },
      data: { closedAt, closingCount, note },
    });
  }

  async list(
    filter: ShiftListFilter,
  ): Promise<{ items: ShiftRow[]; total: number }> {
    const where: Prisma.ShiftWhereInput = {
      storeId: filter.storeId,
      cashierId: filter.cashierId,
      openedAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shift.findMany({
        where,
        include: CASHIER_INCLUDE,
        orderBy: { openedAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.shift.count({ where }),
    ]);
    return { items, total };
  }
}
