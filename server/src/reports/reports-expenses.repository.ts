import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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
  ): Prisma.ExpenseWhereInput {
    return {
      categoryId,
      incurredAt: from || to ? { gte: from, lte: to } : undefined,
    };
  }

  private rangeSql(from?: Date, to?: Date, categoryId?: string): Prisma.Sql {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    const cat = categoryId
      ? Prisma.sql`AND "categoryId" = ${categoryId}::uuid`
      : Prisma.empty;
    return Prisma.sql`"incurredAt" >= ${lower} AND "incurredAt" <= ${upper} ${cat}`;
  }

  async byCategory(
    from?: Date,
    to?: Date,
    categoryId?: string,
  ): Promise<ExpenseReportRow[]> {
    const [grouped, categories] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: this.where(from, to, categoryId),
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
  ): Promise<ExpenseReportRow[]> {
    return this.byPeriod('month', 'YYYY-MM', from, to, categoryId);
  }

  async byDay(
    from?: Date,
    to?: Date,
    categoryId?: string,
  ): Promise<ExpenseReportRow[]> {
    return this.byPeriod('day', 'YYYY-MM-DD', from, to, categoryId);
  }

  private async byPeriod(
    unit: 'month' | 'day',
    fmt: string,
    from?: Date,
    to?: Date,
    categoryId?: string,
  ): Promise<ExpenseReportRow[]> {
    const rows = await this.prisma.$queryRaw<PeriodRow[]>(Prisma.sql`
      SELECT to_char(date_trunc(${unit}, "incurredAt"), ${fmt}) AS key,
             sum("amount")::float8 AS total
      FROM expenses
      WHERE ${this.rangeSql(from, to, categoryId)}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((r) => ({ key: r.key, label: r.key, total: r.total }));
  }
}
