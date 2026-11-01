import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Read-only aggregates for the end-of-day digest (one calendar day, UTC). */
@Injectable()
export class ReportsDailyClosingRepository {
  constructor(private readonly prisma: PrismaService) {}

  salesForDay(from: Date, to: Date) {
    return this.prisma.sale.aggregate({
      where: { soldAt: { gte: from, lt: to } },
      _sum: { salePrice: true, landedCostSnapshot: true },
      _count: true,
    });
  }

  expensesForDay(from: Date, to: Date) {
    return this.prisma.expense.aggregate({
      where: { incurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    });
  }

  newConsignments(from: Date, to: Date) {
    return this.prisma.consignment.count({
      where: { consignedAt: { gte: from, lt: to } },
    });
  }

  settledConsignments(from: Date, to: Date) {
    return this.prisma.consignment.count({
      where: { statusCode: 'SETTLED', resolvedAt: { gte: from, lt: to } },
    });
  }
}
