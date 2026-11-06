import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeConditionSql, storeFilterPrisma } from './lib/store-filter.js';

/** Raw per-day row from the range query (service zero-fills + derives profit). */
export interface DailyClosingRangeRow {
  bucket: Date;
  unitsSold: number;
  revenue: number;
  cogs: number;
  expenses: number;
  newConsignments: number;
  settledConsignments: number;
}

/** Read-only aggregates for the end-of-day digest (one calendar day, UTC). */
@Injectable()
export class ReportsDailyClosingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One aggregate query: every field per day in range (days with activity). */
  rangeByDay(
    from: Date,
    to: Date,
    storeIds?: string[],
  ): Promise<DailyClosingRangeRow[]> {
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('"storeId"', storeIds)}`
        : Prisma.empty;
    return this.prisma.$queryRaw<DailyClosingRangeRow[]>(Prisma.sql`
      WITH s AS (
        SELECT date_trunc('day', "soldAt") AS bucket, count(*)::int AS "unitsSold",
               sum("salePrice")::float8 AS revenue,
               sum("landedCostSnapshot")::float8 AS cogs
        FROM sales WHERE "soldAt" >= ${from} AND "soldAt" <= ${to} ${store} GROUP BY 1
      ),
      e AS (
        SELECT date_trunc('day', "incurredAt") AS bucket, sum(amount)::float8 AS expenses
        FROM expenses WHERE "deletedAt" IS NULL AND "incurredAt" >= ${from} AND "incurredAt" <= ${to} ${store} GROUP BY 1
      ),
      nc AS (
        SELECT date_trunc('day', "consignedAt") AS bucket, count(*)::int AS n
        FROM consignments WHERE "consignedAt" >= ${from} AND "consignedAt" <= ${to} ${store} GROUP BY 1
      ),
      sc AS (
        SELECT date_trunc('day', "resolvedAt") AS bucket, count(*)::int AS n
        FROM consignments
        WHERE "statusCode" = 'SETTLED' AND "resolvedAt" >= ${from} AND "resolvedAt" <= ${to} ${store}
        GROUP BY 1
      ),
      b AS (
        SELECT bucket FROM s UNION SELECT bucket FROM e
        UNION SELECT bucket FROM nc UNION SELECT bucket FROM sc
      )
      SELECT b.bucket,
             coalesce(s."unitsSold", 0) AS "unitsSold",
             coalesce(s.revenue, 0) AS revenue,
             coalesce(s.cogs, 0) AS cogs,
             coalesce(e.expenses, 0) AS expenses,
             coalesce(nc.n, 0) AS "newConsignments",
             coalesce(sc.n, 0) AS "settledConsignments"
      FROM b
      LEFT JOIN s ON s.bucket = b.bucket
      LEFT JOIN e ON e.bucket = b.bucket
      LEFT JOIN nc ON nc.bucket = b.bucket
      LEFT JOIN sc ON sc.bucket = b.bucket
      ORDER BY b.bucket
    `);
  }

  salesForDay(from: Date, to: Date, storeIds?: string[]) {
    return this.prisma.sale.aggregate({
      where: {
        soldAt: { gte: from, lt: to },
        ...(storeIds && storeIds.length > 0
          ? { storeId: storeFilterPrisma(storeIds) }
          : {}),
      },
      _sum: { salePrice: true, landedCostSnapshot: true },
      _count: true,
    });
  }

  expensesForDay(from: Date, to: Date, storeIds?: string[]) {
    return this.prisma.expense.aggregate({
      where: {
        deletedAt: null,
        incurredAt: { gte: from, lt: to },
        ...(storeIds && storeIds.length > 0
          ? { storeId: storeFilterPrisma(storeIds) }
          : {}),
      },
      _sum: { amount: true },
    });
  }

  newConsignments(from: Date, to: Date, storeIds?: string[]) {
    return this.prisma.consignment.count({
      where: {
        consignedAt: { gte: from, lt: to },
        ...(storeIds && storeIds.length > 0
          ? { storeId: storeFilterPrisma(storeIds) }
          : {}),
      },
    });
  }

  settledConsignments(from: Date, to: Date, storeIds?: string[]) {
    return this.prisma.consignment.count({
      where: {
        statusCode: 'SETTLED',
        resolvedAt: { gte: from, lt: to },
        ...(storeIds && storeIds.length > 0
          ? { storeId: storeFilterPrisma(storeIds) }
          : {}),
      },
    });
  }
}
