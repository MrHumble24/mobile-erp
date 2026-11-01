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

  update(id: string, dto: UpdateExpenseCategoryDto) {
    return this.prisma.expenseCategory.update({ where: { id }, data: dto });
  }
}
