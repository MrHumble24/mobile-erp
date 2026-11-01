import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface MonthRow {
  month: string;
  total: number;
}

/** Read-only aggregates for the expenses report (by category or by month). */
@Injectable()
export class ReportsExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private range(from?: Date, to?: Date): Prisma.ExpenseWhereInput {
    return from || to ? { incurredAt: { gte: from, lte: to } } : {};
  }

  async byCategory(from?: Date, to?: Date) {
    const [grouped, categories] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: this.range(from, to),
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

  async byMonth(from?: Date, to?: Date) {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    const rows = await this.prisma.$queryRaw<MonthRow[]>(Prisma.sql`
      SELECT to_char(date_trunc('month', "incurredAt"), 'YYYY-MM') AS month,
             sum("amount")::float8 AS total
      FROM expenses
      WHERE "incurredAt" >= ${lower} AND "incurredAt" <= ${upper}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((r) => ({ key: r.month, label: r.month, total: r.total }));
  }
}
