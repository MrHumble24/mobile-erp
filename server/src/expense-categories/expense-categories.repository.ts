import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';

/** All Prisma access for expense categories. */
@Injectable()
export class ExpenseCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.expenseCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.expenseCategory.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.expenseCategory.findUnique({ where: { name } });
  }

  create(dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({ data: dto });
  }

  update(id: string, dto: Omit<UpdateExpenseCategoryDto, 'reassignToId'>) {
    return this.prisma.expenseCategory.update({ where: { id }, data: dto });
  }

  /** Count live (non-deleted) expenses in a category — drives the deactivate guard. */
  countExpenses(categoryId: string) {
    return this.prisma.expense.count({
      where: { categoryId, deletedAt: null },
    });
  }

  /** Move every expense & recurrence template from one category to another, atomically. */
  reassign(fromId: string, toId: string) {
    return this.prisma.$transaction([
      this.prisma.expense.updateMany({
        where: { categoryId: fromId },
        data: { categoryId: toId },
      }),
      this.prisma.expenseRecurrence.updateMany({
        where: { categoryId: fromId },
        data: { categoryId: toId },
      }),
    ]);
  }
}
