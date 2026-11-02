import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

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

  counts(from?: Date, to?: Date) {
    const resolved = from || to ? { gte: from, lte: to } : undefined;
    const created = from || to ? { gte: from, lte: to } : undefined;
    return this.prisma.$transaction([
      this.prisma.consignment.count({ where: { consignedAt: created } }),
      this.prisma.consignment.count({
        where: { statusCode: 'SETTLED', resolvedAt: resolved },
      }),
      this.prisma.consignment.count({
        where: { statusCode: 'RETURNED', resolvedAt: resolved },
      }),
    ]);
  }

  /** B2B revenue per partner from sales that carry a consignmentId, in range. */
  settledRevenueByPartner(
    from?: Date,
    to?: Date,
  ): Promise<PartnerRevenueRow[]> {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    return this.prisma.$queryRaw<PartnerRevenueRow[]>(Prisma.sql`
      SELECT c."partnerId" AS "partnerId",
             sum(s."salePrice")::float8 AS "settledRevenue"
      FROM sales s
      JOIN consignments c ON c.id = s."consignmentId"
      WHERE s."soldAt" >= ${lower} AND s."soldAt" <= ${upper}
      GROUP BY 1
    `);
  }
}
