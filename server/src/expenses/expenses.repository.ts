import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpenseDailyPoint, ExpenseFilter } from './types/expense.types.js';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  createdBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ExpenseInclude;

/** All Prisma access for expenses. Every read excludes soft-deleted rows. */
@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: ExpenseFilter) {
    const where = this.toWhere(filter);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { [filter.sort]: filter.dir },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: LIST_INCLUDE,
    });
  }

  create(
    data: Omit<CreateExpenseDto, 'incurredAt'> & {
      createdById: string;
      incurredAt?: Date;
    },
  ) {
    return this.prisma.expense.create({ data, include: LIST_INCLUDE });
  }

  update(
    id: string,
    data: Omit<UpdateExpenseDto, 'incurredAt'> & { incurredAt?: Date },
  ) {
    return this.prisma.expense.update({
      where: { id },
      data,
      include: LIST_INCLUDE,
    });
  }

  /** Soft delete — keeps the row for report history, hides it from every read. */
  async softRemove(id: string) {
    await this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  sumAgg(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });
  }

  sumByCategory(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
    });
  }

  async dailySeries(from?: Date, to?: Date): Promise<ExpenseDailyPoint[]> {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    const rows = await this.prisma.$queryRaw<
      { date: string; total: number }[]
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', "incurredAt"), 'YYYY-MM-DD') AS date,
             sum("amount")::float8 AS total
      FROM expenses
      WHERE "deletedAt" IS NULL
        AND "incurredAt" >= ${lower} AND "incurredAt" <= ${upper}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((r) => ({ date: r.date, total: r.total }));
  }

  toWhere(filter: {
    from?: Date;
    to?: Date;
    categoryId?: string;
    recordedById?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
  }): Prisma.ExpenseWhereInput {
    const amount =
      filter.minAmount !== undefined || filter.maxAmount !== undefined
        ? { gte: filter.minAmount, lte: filter.maxAmount }
        : undefined;
    const search = filter.search?.trim();
    return {
      deletedAt: null,
      categoryId: filter.categoryId,
      createdById: filter.recordedById,
      isRecurring: filter.isRecurring,
      amount,
      incurredAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
      OR: search
        ? [
            { description: { contains: search, mode: 'insensitive' } },
            { vendor: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }
}
