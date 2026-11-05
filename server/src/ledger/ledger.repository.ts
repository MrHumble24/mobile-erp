import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  LedgerFilter,
  LedgerPost,
  LedgerSourceField,
} from './types/ledger.types.js';

type Tx = Prisma.TransactionClient;

const LIST_INCLUDE = {
  account: { select: { code: true, label: true } },
  type: { select: { code: true, label: true } },
  createdBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.CashTransactionInclude;

/** All Prisma access for the ledger. The ledger is append-only: no update/delete. */
@Injectable()
export class LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append one signed row. Pass `tx` to post inside a caller's transaction so a
   * sale and its ledger rows commit atomically (2b); omit it for a standalone
   * manual entry.
   */
  create(post: LedgerPost, tx?: Tx) {
    return (tx ?? this.prisma).cashTransaction.create({
      data: post,
      include: LIST_INCLUDE,
    });
  }

  /** The two rows of a transfer, written atomically. */
  createTransfer(from: LedgerPost, to: LedgerPost) {
    return this.prisma.$transaction(async (tx) => {
      await this.create(from, tx);
      return this.create(to, tx);
    });
  }

  async findMany(filter: LedgerFilter) {
    const where = this.toWhere(filter);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashTransaction.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { [filter.sort]: filter.dir },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);
    return { items, total };
  }

  /** Per-account sum; pass `before` to get the balance as of the day's start. */
  sumByAccount(storeId: string, before?: Date) {
    return this.prisma.cashTransaction.groupBy({
      by: ['accountCode'],
      where: { storeId, occurredAt: before ? { lt: before } : undefined },
      _sum: { amount: true },
    });
  }

  /**
   * Net amount per (source row, account) for the given type codes — one query
   * that powers every derived read: a sale's payments, an expense's current
   * account, a partner payment's account. Rows are keyed by `field`.
   */
  groupBySource(field: LedgerSourceField, typeCodes: string[], ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.cashTransaction.groupBy({
      by: [field, 'accountCode'],
      where: { [field]: { in: ids }, typeCode: { in: typeCodes } },
      _sum: { amount: true },
    });
  }

  /** Every cash row a user posted in [from, to] for a store — the shift report's
   * raw input (ADR 0036). SHIFT_DIFFERENCE rows are kept here and filtered out
   * by the pure summary, which never treats them as movement. */
  rowsForUserWindow(
    storeId: string,
    createdById: string,
    from: Date,
    to: Date,
  ) {
    return this.prisma.cashTransaction.findMany({
      where: { storeId, createdById, occurredAt: { gte: from, lte: to } },
      select: { typeCode: true, accountCode: true, amount: true },
    });
  }

  /** Signed sum of one type's rows for a store in [from, to] (ADR 0040 report). */
  async sumType(storeId: string, typeCode: string, from?: Date, to?: Date) {
    const { _sum } = await this.prisma.cashTransaction.aggregate({
      where: {
        storeId,
        typeCode,
        occurredAt: from || to ? { gte: from, lte: to } : undefined,
      },
      _sum: { amount: true },
    });
    return _sum.amount ?? new Prisma.Decimal(0);
  }

  /** Net SHIFT_DIFFERENCE per shift, for the shifts list (ADR 0036). */
  sumDifferenceByShift(shiftIds: string[]) {
    return this.prisma.cashTransaction.groupBy({
      by: ['shiftId'],
      where: { shiftId: { in: shiftIds }, typeCode: 'SHIFT_DIFFERENCE' },
      _sum: { amount: true },
    });
  }

  listAccounts() {
    return this.prisma.cashAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, label: true },
    });
  }

  accountExists(code: string) {
    return this.prisma.cashAccount.findFirst({
      where: { code, isActive: true },
      select: { code: true },
    });
  }

  openingExists(storeId: string, accountCode: string) {
    return this.prisma.cashTransaction.findFirst({
      where: { storeId, accountCode, typeCode: 'OPENING' },
      select: { id: true },
    });
  }

  toWhere(filter: LedgerFilter): Prisma.CashTransactionWhereInput {
    return {
      storeId: filter.storeId,
      accountCode: filter.accountCode,
      typeCode: filter.typeCode,
      occurredAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };
  }
}
