import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeFilterPrisma } from './lib/store-filter.js';

/** Read-only aggregates for the profit report. Reports owns cross-table reads. */
@Injectable()
export class ReportsProfitRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One pass over sales in range: revenue, COGS and units sold. */
  private saleWhere(
    from?: Date,
    to?: Date,
    storeIds?: string[],
  ): Prisma.SaleWhereInput {
    const where: Prisma.SaleWhereInput =
      from || to ? { soldAt: { gte: from, lte: to } } : {};
    if (storeIds && storeIds.length > 0) {
      where.storeId = storeFilterPrisma(storeIds);
    }
    return where;
  }

  salesTotals(from?: Date, to?: Date, storeIds?: string[]) {
    return this.prisma.sale.aggregate({
      where: this.saleWhere(from, to, storeIds),
      _sum: { salePrice: true, landedCostSnapshot: true },
      _count: true,
    });
  }

  channelRevenue(
    channel: 'retail' | 'b2b',
    from?: Date,
    to?: Date,
    storeIds?: string[],
  ) {
    return this.prisma.sale.aggregate({
      where: {
        ...this.saleWhere(from, to, storeIds),
        consignmentId: channel === 'retail' ? null : { not: null },
      },
      _sum: { salePrice: true },
    });
  }

  /** Σ(listPriceSnapshot − salePrice) over sales that carry a snapshot. */
  discountsTotals(from?: Date, to?: Date, storeIds?: string[]) {
    return this.prisma.sale.aggregate({
      where: {
        ...this.saleWhere(from, to, storeIds),
        listPriceSnapshot: { not: null },
      },
      _sum: { listPriceSnapshot: true, salePrice: true },
    });
  }

  returnsRefunded(from?: Date, to?: Date, storeIds?: string[]) {
    const where: Prisma.SaleReturnWhereInput =
      from || to ? { returnedAt: { gte: from, lte: to } } : {};
    if (storeIds && storeIds.length > 0) {
      where.sale = { storeId: storeFilterPrisma(storeIds) };
    }
    return this.prisma.saleReturn.aggregate({
      where,
      _sum: { refundAmount: true },
    });
  }

  expensesTotal(from?: Date, to?: Date, storeIds?: string[]) {
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      incurredAt: from || to ? { gte: from, lte: to } : undefined,
    };
    if (storeIds && storeIds.length > 0) {
      where.storeId = storeFilterPrisma(storeIds);
    }
    return this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });
  }

  /** Points given (EARN) and spent (SPEND) in range, by type (ADR 0043). */
  bonusByType(from?: Date, to?: Date, storeIds?: string[]) {
    const where: Prisma.BonusTransactionWhereInput = {
      typeCode: { in: ['EARN', 'SPEND'] },
      occurredAt: from || to ? { gte: from, lte: to } : undefined,
    };
    if (storeIds && storeIds.length > 0) {
      where.storeId = storeFilterPrisma(storeIds);
    }
    return this.prisma.bonusTransaction.groupBy({
      by: ['typeCode'],
      where,
      _sum: { amount: true },
    });
  }
}
