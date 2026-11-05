import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeConditionSql } from './lib/store-filter.js';
import { BreakdownGroupBy, BreakdownRawRow } from './types/reports.types.js';

const SUMS = Prisma.sql`
  sum(s."salePrice")::float8 AS revenue,
  sum(s."landedCostSnapshot")::float8 AS cogs,
  count(*)::int AS "unitsSold"
`;

/** Profit aggregates grouped by channel, model, cashier or day. One query each. */
@Injectable()
export class ReportsBreakdownRepository {
  constructor(private readonly prisma: PrismaService) {}

  breakdown(
    groupBy: BreakdownGroupBy,
    from: Date,
    to: Date,
    storeIds?: string[],
  ): Promise<BreakdownRawRow[]> {
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('s."storeId"', storeIds)}`
        : Prisma.empty;
    const where = Prisma.sql`WHERE s."soldAt" >= ${from} AND s."soldAt" <= ${to} ${store}`;
    return this.prisma.$queryRaw<BreakdownRawRow[]>(this.sql(groupBy, where));
  }

  private sql(groupBy: BreakdownGroupBy, where: Prisma.Sql): Prisma.Sql {
    if (groupBy === 'channel') {
      return Prisma.sql`
        SELECT (CASE WHEN s."consignmentId" IS NULL THEN 'retail' ELSE 'b2b' END) AS key,
                (CASE WHEN s."consignmentId" IS NULL THEN 'Retail' ELSE 'B2B' END) AS label,
                ${SUMS}
        FROM sales s ${where} GROUP BY 1, 2`;
    }
    if (groupBy === 'model') {
      // A quantity sale has no device; its model is on the sale itself. Join on
      // the effective model id so quantity sales group under their own model.
      return Prisma.sql`
        SELECT coalesce(d."modelId", s."modelId") AS key,
                (m.brand || ' ' || m.name) AS label, ${SUMS}
        FROM sales s
        LEFT JOIN devices d ON d.id = s."deviceId"
        JOIN device_models m ON m.id = coalesce(d."modelId", s."modelId")
        ${where} GROUP BY 1, 2`;
    }
    if (groupBy === 'cashier') {
      return Prisma.sql`
        SELECT s."soldById" AS key,
                coalesce(trim(p."firstName" || ' ' || coalesce(p."lastName", '')), s."soldById") AS label,
                ${SUMS}
        FROM sales s
        LEFT JOIN user_profiles p ON p."userId" = s."soldById"
        ${where} GROUP BY 1, 2`;
    }
    return Prisma.sql`
      SELECT to_char(date_trunc('day', s."soldAt"), 'YYYY-MM-DD') AS key,
             to_char(date_trunc('day', s."soldAt"), 'YYYY-MM-DD') AS label,
             ${SUMS}
      FROM sales s ${where} GROUP BY 1, 2`;
  }
}
