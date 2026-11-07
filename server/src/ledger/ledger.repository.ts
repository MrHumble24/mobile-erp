import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  COST_TYPE_CODES,
  type LedgerAccountBreakdownItem,
  type LedgerFilter,
  type LedgerPost,
  type LedgerSourceField,
  type LedgerStats,
  type LedgerTimelinePoint,
  type LedgerTypeBreakdownItem,
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
  device: {
    select: {
      id: true,
      imei: true,
      model: { select: { id: true, name: true, brand: true } },
    },
  },
  shipment: {
    select: {
      id: true,
      supplier: { select: { id: true, name: true } },
    },
  },
  sale: {
    select: {
      id: true,
      clientMutationId: true,
      customer: { select: { id: true, name: true, phone: true } },
      device: {
        select: {
          id: true,
          imei: true,
          model: { select: { id: true, name: true, brand: true } },
        },
      },
      model: { select: { id: true, name: true, brand: true } },
      quantity: true,
    },
  },
  expense: {
    select: {
      id: true,
      vendor: true,
      description: true,
      category: { select: { id: true, name: true } },
    },
  },
  partnerPayment: {
    select: {
      id: true,
      partner: { select: { id: true, shopName: true } },
    },
  },
  customerPurchase: {
    select: {
      id: true,
      customer: { select: { id: true, name: true } },
      device: {
        select: {
          id: true,
          imei: true,
          model: { select: { id: true, name: true } },
        },
      },
    },
  },
  repairPayment: {
    select: {
      id: true,
      repair: {
        select: {
          id: true,
          ticketNumber: true,
          deviceName: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  },
  creditPayment: {
    select: {
      id: true,
      credit: {
        select: {
          id: true,
          customer: { select: { id: true, name: true } },
        },
      },
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
        orderBy: [{ [filter.sort]: filter.dir }, { createdAt: filter.dir }, { id: filter.dir }],
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

    let totalIn = new Prisma.Decimal(0);
    let totalOut = new Prisma.Decimal(0);
    let inCount = 0;
    let outCount = 0;

    const timelineMap = new Map<string, { inflow: number; outflow: number; net: number }>();
    const typeMap = new Map<
      string,
      {
        typeCode: string;
        typeLabel: string;
        direction: 'in' | 'out';
        amount: Prisma.Decimal;
        count: number;
      }
    >();
    const accountMap = new Map<
      string,
      {
        accountCode: string;
        accountLabel: string;
        inflow: Prisma.Decimal;
        outflow: Prisma.Decimal;
        net: Prisma.Decimal;
      }
    >();

    for (const row of rows) {
      const isCost = COST_TYPE_CODES.has(row.typeCode);
      if (!canViewCost && isCost) {
        continue;
      }

      const amt = row.amount;
      const numAmt = Number(amt);
      const isPositive = numAmt > 0;
      const absAmt = Math.abs(numAmt);

      if (isPositive) {
        totalIn = totalIn.plus(amt);
        inCount++;
      } else {
        totalOut = totalOut.plus(amt.abs());
        outCount++;
      }

      const dateKey = row.occurredAt.toISOString().slice(0, 10);
      const point = timelineMap.get(dateKey) ?? { inflow: 0, outflow: 0, net: 0 };
      if (isPositive) {
        point.inflow += numAmt;
        point.net += numAmt;
      } else {
        point.outflow += absAmt;
        point.net += numAmt;
      }
      timelineMap.set(dateKey, point);

      const typeKey = row.typeCode;
      const typeItem = typeMap.get(typeKey) ?? {
        typeCode: row.typeCode,
        typeLabel: row.type.label,
        direction: isPositive ? 'in' : 'out',
        amount: new Prisma.Decimal(0),
        count: 0,
      };
      typeItem.amount = typeItem.amount.plus(amt.abs());
      typeItem.count++;
      typeMap.set(typeKey, typeItem);

      const accKey = row.accountCode;
      const accItem = accountMap.get(accKey) ?? {
        accountCode: row.accountCode,
        accountLabel: row.account.label,
        inflow: new Prisma.Decimal(0),
        outflow: new Prisma.Decimal(0),
        net: new Prisma.Decimal(0),
      };
      if (isPositive) {
        accItem.inflow = accItem.inflow.plus(amt);
      } else {
        accItem.outflow = accItem.outflow.plus(amt.abs());
      }
      accItem.net = accItem.net.plus(amt);
      accountMap.set(accKey, accItem);
    }

    const netFlow = totalIn.minus(totalOut);

    const timeline: LedgerTimelinePoint[] = Array.from(timelineMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date,
        inflow: Number(val.inflow.toFixed(2)),
        outflow: Number(val.outflow.toFixed(2)),
        net: Number(val.net.toFixed(2)),
      }));

    const totalOutNum = Number(totalOut.toFixed(2));
    const totalInNum = Number(totalIn.toFixed(2));

    const byType: LedgerTypeBreakdownItem[] = Array.from(typeMap.values())
      .map((t) => {
        const amtNum = Number(t.amount.toFixed(2));
        const base = t.direction === 'in' ? totalInNum : totalOutNum;
        const percentage = base > 0 ? Number(((amtNum / base) * 100).toFixed(1)) : 0;
        return {
          typeCode: t.typeCode,
          typeLabel: t.typeLabel,
          direction: t.direction,
          amount: amtNum,
          count: t.count,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const byAccount: LedgerAccountBreakdownItem[] = Array.from(accountMap.values()).map((a) => ({
      accountCode: a.accountCode,
      accountLabel: a.accountLabel,
      inflow: Number(a.inflow.toFixed(2)),
      outflow: Number(a.outflow.toFixed(2)),
      net: Number(a.net.toFixed(2)),
    }));

    return {
      summary: {
        totalIn: totalIn.toFixed(2),
        totalOut: totalOut.toFixed(2),
        netFlow: netFlow.toFixed(2),
        transactionCount: inCount + outCount,
        inCount,
        outCount,
      },
      timeline,
      byType,
      byAccount,
    };
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
        { shipment: { supplier: { name: { contains: q, mode: 'insensitive' } } } },
        { expense: { description: { contains: q, mode: 'insensitive' } } },
        { expense: { vendor: { contains: q, mode: 'insensitive' } } },
        { expense: { category: { name: { contains: q, mode: 'insensitive' } } } },
        { sale: { customer: { name: { contains: q, mode: 'insensitive' } } } },
        { partnerPayment: { partner: { shopName: { contains: q, mode: 'insensitive' } } } },
        { customerPurchase: { customer: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    return where;
  }
}
