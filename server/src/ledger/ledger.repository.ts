import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LIST_INCLUDE } from './lib/ledger-list-include.js';
import { aggregateStats } from './lib/ledger-stats.js';
import {
  type LedgerFilter,
  type LedgerPost,
  type LedgerSourceField,
  type LedgerStats,
} from './types/ledger.types.js';

type Tx = Prisma.TransactionClient;

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
        orderBy: [
          { [filter.sort]: filter.dir },
          { createdAt: filter.dir },
          { id: filter.dir },
        ],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);

    if (items.length === 0) {
      return { items: [], total };
    }

    const itemIds = items.map((i) => i.id);
    const balanceRows = await this.prisma.$queryRawUnsafe<
      { id: string; accountRunningBalance: string }[]
    >(
      `WITH ordered AS (
        SELECT
          id,
          SUM(amount) OVER (
            PARTITION BY "storeId", "accountCode"
            ORDER BY "occurredAt" ASC, "createdAt" ASC, id ASC
          ) as "accountRunningBalance"
        FROM cash_transactions
        WHERE "storeId" = $1
      )
      SELECT id, "accountRunningBalance"::text FROM ordered WHERE id = ANY($2::text[])`,
      filter.storeId,
      itemIds,
    );

    const balanceMap = new Map(
      balanceRows.map((r) => [r.id, r.accountRunningBalance]),
    );

    const enriched = items.map((item) => ({
      ...item,
      accountRunningBalance: balanceMap.get(item.id) ?? null,
    }));

    return { items: enriched, total };
  }

  async getStats(
    storeId: string,
    filter: { accountCode?: string; from?: Date; to?: Date },
    canViewCost = true,
  ): Promise<LedgerStats> {
    const where: Prisma.CashTransactionWhereInput = {
      storeId,
      accountCode: filter.accountCode,
      occurredAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };

    const rows = await this.prisma.cashTransaction.findMany({
      where,
      select: {
        id: true,
        amount: true,
        typeCode: true,
        accountCode: true,
        occurredAt: true,
        type: { select: { label: true } },
        account: { select: { label: true } },
      },
      orderBy: { occurredAt: 'asc' },
    });

    return aggregateStats(rows, canViewCost);
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
  sumType(storeId: string, typeCode: string, from?: Date, to?: Date) {
    return this.sumTypeForStores([storeId], typeCode, from, to);
  }

  /** Like `sumType`, but scoped to several stores (the repairs report uses the
   * same store set as its income / parts figures, including "all stores"). */
  async sumTypeForStores(
    storeIds: string[],
    typeCode: string,
    from?: Date,
    to?: Date,
  ) {
    const { _sum } = await this.prisma.cashTransaction.aggregate({
      where: {
        storeId: storeIds.length === 1 ? storeIds[0] : { in: storeIds },
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
    const where: Prisma.CashTransactionWhereInput = {
      storeId: filter.storeId,
      accountCode: filter.accountCode,
      typeCode: filter.typeCode,
      occurredAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };

    if (filter.direction === 'in') {
      where.amount = { gt: 0 };
    } else if (filter.direction === 'out') {
      where.amount = { lt: 0 };
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { note: { contains: q, mode: 'insensitive' } },
        { device: { imei: { contains: q, mode: 'insensitive' } } },
        { device: { model: { name: { contains: q, mode: 'insensitive' } } } },
        {
          shipment: {
            supplier: { name: { contains: q, mode: 'insensitive' } },
          },
        },
        { expense: { description: { contains: q, mode: 'insensitive' } } },
        { expense: { vendor: { contains: q, mode: 'insensitive' } } },
        {
          expense: { category: { name: { contains: q, mode: 'insensitive' } } },
        },
        { sale: { customer: { name: { contains: q, mode: 'insensitive' } } } },
        {
          partnerPayment: {
            partner: { shopName: { contains: q, mode: 'insensitive' } },
          },
        },
        {
          customerPurchase: {
            customer: { name: { contains: q, mode: 'insensitive' } },
          },
        },
      ];
    }

    return where;
  }
}
