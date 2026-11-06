import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeConditionSql, storeFilterPrisma } from './lib/store-filter.js';

interface PartnerRevenueRow {
  partnerId: string;
  settledRevenue: number;
}

/**
 * Counts and settled revenue for the consignment report. Per-partner balances
 * (outstanding/open/overdue) are read through PartnersService, not here.
 */
@Injectable()
export class ReportsConsignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  counts(from?: Date, to?: Date, storeIds?: string[]) {
    const resolved = from || to ? { gte: from, lte: to } : undefined;
    const created = from || to ? { gte: from, lte: to } : undefined;
    const store =
      storeIds && storeIds.length > 0
        ? { storeId: storeFilterPrisma(storeIds) }
        : {};
    return this.prisma.$transaction([
      this.prisma.consignment.count({
        where: { consignedAt: created, ...store },
      }),
      this.prisma.consignment.count({
        where: { statusCode: 'SETTLED', resolvedAt: resolved, ...store },
      }),
      this.prisma.consignment.count({
        where: { statusCode: 'RETURNED', resolvedAt: resolved, ...store },
      }),
    ]);
  }

  /** B2B revenue per partner from sales that carry a consignmentId, in range. */
  settledRevenueByPartner(
    from?: Date,
    to?: Date,
    storeIds?: string[],
  ): Promise<PartnerRevenueRow[]> {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('s."storeId"', storeIds)}`
        : Prisma.empty;
    return this.prisma.$queryRaw<PartnerRevenueRow[]>(Prisma.sql`
      SELECT c."partnerId" AS "partnerId",
             sum(s."salePrice")::float8 AS "settledRevenue"
      FROM sales s
      JOIN consignments c ON c.id = s."consignmentId"
      WHERE s."soldAt" >= ${lower} AND s."soldAt" <= ${upper} ${store}
      GROUP BY 1
    `);
  }
}
