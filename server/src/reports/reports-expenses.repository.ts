import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeConditionSql, storeFilterPrisma } from './lib/store-filter.js';
import { ExpenseReportRow } from './types/reports.types.js';

interface PeriodRow {
  key: string;
  total: number;
}

/** Read-only aggregates for the expenses report (category, month or day). */
@Injectable()
export class ReportsExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private where(
    from?: Date,
    to?: Date,
    categoryId?: string,
    storeIds?: string[],
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {
      categoryId,
      deletedAt: null,
      incurredAt: from || to ? { gte: from, lte: to } : undefined,
    };
    if (storeIds && storeIds.length > 0) {
      where.storeId = storeFilterPrisma(storeIds);
    }
    return where;
  }

  private rangeSql(
    from?: Date,
    to?: Date,
    categoryId?: string,
    storeIds?: string[],
  ): Prisma.Sql {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    const cat = categoryId
      ? Prisma.sql`AND "categoryId" = ${categoryId}::uuid`
      : Prisma.empty;
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('"storeId"', storeIds)}`
        : Prisma.empty;
    return Prisma.sql`"deletedAt" IS NULL AND "incurredAt" >= ${lower} AND "incurredAt" <= ${upper} ${cat} ${store}`;
  }

  async byCategory(
    from?: Date,
    to?: Date,
    categoryId?: string,
    storeIds?: string[],
  ): Promise<ExpenseReportRow[]> {
    const [grouped, categories] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: this.where(from, to, categoryId, storeIds),
        _sum: { amount: true },
      }),
      this.prisma.expenseCategory.findMany({
        select: { id: true, name: true },
      }),
    ]);
    const nameOf = new Map(categories.map((c) => [c.id, c.name]));
    return grouped.map((g) => ({
      key: g.categoryId,
      label: nameOf.get(g.categoryId) ?? 'Unknown',
      total: Number(g._sum.amount ?? 0),
    }));
  }

  async byMonth(
    from?: Date,
    to?: Date,
    categoryId?: string,
    storeIds?: string[],
  ): Promise<ExpenseReportRow[]> {
    return this.byPeriod('month', 'YYYY-MM', from, to, categoryId, storeIds);
  }

  async byDay(
    from?: Date,
    to?: Date,
    categoryId?: string,
    storeIds?: string[],
  ): Promise<ExpenseReportRow[]> {
    return this.byPeriod('day', 'YYYY-MM-DD', from, to, categoryId, storeIds);
  }

  private async byPeriod(
    unit: 'month' | 'day',
    fmt: string,
    from?: Date,
    to?: Date,
    categoryId?: string,
    storeIds?: string[],
  ): Promise<ExpenseReportRow[]> {
    const rows = await this.prisma.$queryRaw<PeriodRow[]>(Prisma.sql`
      SELECT to_char(date_trunc(${unit}, "incurredAt"), ${fmt}) AS key,
             sum("amount")::float8 AS total
      FROM expenses
      WHERE ${this.rangeSql(from, to, categoryId, storeIds)}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((r) => ({ key: r.key, label: r.key, total: r.total }));
  }
}
