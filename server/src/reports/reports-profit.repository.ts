import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Read-only aggregates for the profit report. Reports owns cross-table reads. */
@Injectable()
export class ReportsProfitRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One pass over sales in range: revenue, COGS and units sold. */
  private saleWhere(from?: Date, to?: Date): Prisma.SaleWhereInput {
    return from || to ? { soldAt: { gte: from, lte: to } } : {};
  }

  salesTotals(from?: Date, to?: Date) {
    return this.prisma.sale.aggregate({
      where: this.saleWhere(from, to),
      _sum: { salePrice: true, landedCostSnapshot: true },
      _count: true,
    });
  }

  channelRevenue(channel: 'retail' | 'b2b', from?: Date, to?: Date) {
    return this.prisma.sale.aggregate({
      where: {
        ...this.saleWhere(from, to),
        consignmentId: channel === 'retail' ? null : { not: null },
      },
      _sum: { salePrice: true },
    });
  }

  /** Σ(listPriceSnapshot − salePrice) over sales that carry a snapshot. */
  discountsTotals(from?: Date, to?: Date) {
    return this.prisma.sale.aggregate({
      where: { ...this.saleWhere(from, to), listPriceSnapshot: { not: null } },
      _sum: { listPriceSnapshot: true, salePrice: true },
    });
  }

  returnsRefunded(from?: Date, to?: Date) {
    return this.prisma.saleReturn.aggregate({
      where: from || to ? { returnedAt: { gte: from, lte: to } } : {},
      _sum: { refundAmount: true },
    });
  }

  expensesTotal(from?: Date, to?: Date) {
    return this.prisma.expense.aggregate({
      where: {
        deletedAt: null,
        incurredAt: from || to ? { gte: from, lte: to } : undefined,
      },
      _sum: { amount: true },
    });
  }
}
