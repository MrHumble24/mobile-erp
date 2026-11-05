import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeConditionSql } from './lib/store-filter.js';
import { TrendBucket, TrendRawRow } from './types/reports.types.js';

/**
 * One aggregate query: per-bucket revenue, COGS, units, expenses and refunds,
 * joined from three tables by truncated bucket. Zero-fill happens in the
 * service so it stays unit-testable. `bucket` is a validated bound parameter.
 */
@Injectable()
export class ReportsTrendRepository {
  constructor(private readonly prisma: PrismaService) {}

  async series(
    from: Date,
    to: Date,
    bucket: TrendBucket,
    storeIds?: string[],
  ): Promise<TrendRawRow[]> {
    const sStore =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('s."storeId"', storeIds)}`
        : Prisma.empty;
    const eStore =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('e."storeId"', storeIds)}`
        : Prisma.empty;
    return this.prisma.$queryRaw<TrendRawRow[]>(
      buildTrendSql(bucket, from, to, sStore, eStore),
    );
  }
}

function buildTrendSql(
  bucket: TrendBucket,
  from: Date,
  to: Date,
  sStore: Prisma.Sql,
  eStore: Prisma.Sql,
): Prisma.Sql {
  return Prisma.sql`
    WITH s AS (
      SELECT date_trunc(${bucket}, s."soldAt") AS bucket,
             sum(s."salePrice")::float8 AS revenue,
             sum(s."landedCostSnapshot")::float8 AS cogs,
             count(*)::int AS "unitsSold"
      FROM sales s WHERE s."soldAt" >= ${from} AND s."soldAt" <= ${to} ${sStore}
      GROUP BY 1
    ),
    e AS (
      SELECT date_trunc(${bucket}, e."incurredAt") AS bucket,
             sum(e.amount)::float8 AS expenses
      FROM expenses e WHERE e."deletedAt" IS NULL AND e."incurredAt" >= ${from} AND e."incurredAt" <= ${to} ${eStore}
      GROUP BY 1
    ),
    r AS (
      SELECT date_trunc(${bucket}, r."returnedAt") AS bucket,
             sum(r."refundAmount")::float8 AS "returnsRefunded"
      FROM sale_returns r
      JOIN sales s ON s.id = r."saleId"
      WHERE r."returnedAt" >= ${from} AND r."returnedAt" <= ${to} ${sStore}
      GROUP BY 1
    ),
    b AS (
      SELECT bucket FROM s UNION SELECT bucket FROM e UNION SELECT bucket FROM r
    )
    SELECT b.bucket,
           coalesce(s.revenue, 0) AS revenue,
           coalesce(s.cogs, 0) AS cogs,
           coalesce(s."unitsSold", 0) AS "unitsSold",
           coalesce(e.expenses, 0) AS expenses,
           coalesce(r."returnsRefunded", 0) AS "returnsRefunded"
    FROM b
    LEFT JOIN s ON s.bucket = b.bucket
    LEFT JOIN e ON e.bucket = b.bucket
    LEFT JOIN r ON r.bucket = b.bucket
    ORDER BY b.bucket
  `;
}
