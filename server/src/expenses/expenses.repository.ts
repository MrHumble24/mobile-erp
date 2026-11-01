import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpenseFilter } from './types/expense.types.js';

/** All Prisma access for expenses. */
@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: ExpenseFilter) {
    const where = this.toWhere(filter);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { incurredAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  create(
    data: Omit<CreateExpenseDto, 'incurredAt'> & {
      createdById: string;
      incurredAt?: Date;
    },
  ) {
    return this.prisma.expense.create({ data });
  }

  update(
    id: string,
    data: Omit<UpdateExpenseDto, 'incurredAt'> & { incurredAt?: Date },
  ) {
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.expense.delete({ where: { id } });
  }

  sumTotal(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.aggregate({ where, _sum: { amount: true } });
  }

  sumByCategory(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
    });
  }

  toWhere(filter: {
    from?: Date;
    to?: Date;
    categoryId?: string;
    isRecurring?: boolean;
  }): Prisma.ExpenseWhereInput {
    return {
      categoryId: filter.categoryId,
      isRecurring: filter.isRecurring,
      incurredAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };
  }
}
