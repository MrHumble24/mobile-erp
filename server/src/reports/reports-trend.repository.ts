import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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
  ): Promise<TrendRawRow[]> {
    return this.prisma.$queryRaw<TrendRawRow[]>(Prisma.sql`
      WITH s AS (
        SELECT date_trunc(${bucket}, "soldAt") AS bucket,
               sum("salePrice")::float8 AS revenue,
               sum("landedCostSnapshot")::float8 AS cogs,
               count(*)::int AS "unitsSold"
        FROM sales WHERE "soldAt" >= ${from} AND "soldAt" <= ${to}
        GROUP BY 1
      ),
      e AS (
        SELECT date_trunc(${bucket}, "incurredAt") AS bucket,
               sum(amount)::float8 AS expenses
        FROM expenses WHERE "deletedAt" IS NULL AND "incurredAt" >= ${from} AND "incurredAt" <= ${to}
        GROUP BY 1
      ),
      r AS (
        SELECT date_trunc(${bucket}, "returnedAt") AS bucket,
               sum("refundAmount")::float8 AS "returnsRefunded"
        FROM sale_returns WHERE "returnedAt" >= ${from} AND "returnedAt" <= ${to}
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
    `);
  }
}
