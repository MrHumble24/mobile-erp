import { Injectable, NotFoundException } from '@nestjs/common';
import { toNumber } from '../common/lib/to-number.js';
import { ExpenseCategoriesService } from '../expense-categories/expense-categories.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import {
  ExpenseQueryDto,
  ExpenseSummaryQueryDto,
} from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpensesRepository } from './expenses.repository.js';
import { pickTopCategory, previousPeriod } from './lib/summary.lib.js';
import { ExpenseCategoryTotal, ExpenseSummary } from './types/expense.types.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly repo: ExpensesRepository,
    private readonly categories: ExpenseCategoriesService,
  ) {}

  async list(query: ExpenseQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const { items, total } = await this.repo.findMany({
      from: parseDate(query.from),
      to: parseDate(query.to),
      categoryId: query.categoryId,
      recordedById: query.recordedById,
      search: query.search,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      isRecurring: query.isRecurring,
      sort: query.sort ?? 'incurredAt',
      dir: query.dir ?? 'desc',
      page,
      pageSize,
    });
    return { items, total, page, pageSize };
  }

  async get(id: string) {
    return this.require(id);
  }

  create(createdById: string, dto: CreateExpenseDto) {
    const { incurredAt, ...rest } = dto;
    return this.repo.create({
      ...rest,
      createdById,
      incurredAt: parseDate(incurredAt),
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.require(id);
    const { incurredAt, ...rest } = dto;
    return this.repo.update(id, { ...rest, incurredAt: parseDate(incurredAt) });
  }

  async remove(id: string) {
    await this.require(id);
    await this.repo.softRemove(id);
  }

  async summary(query: ExpenseSummaryQueryDto): Promise<ExpenseSummary> {
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const prev = previousPeriod(from, to);
    const [agg, prevAgg, grouped, categories, daily] = await Promise.all([
      this.repo.sumAgg(this.repo.toWhere({ from, to })),
      this.repo.sumAgg(this.repo.toWhere({ from: prev.from, to: prev.to })),
      this.repo.sumByCategory(this.repo.toWhere({ from, to })),
      this.categories.list(),
      this.repo.dailySeries(from, to),
    ]);
    const nameOf = new Map(categories.map((c) => [c.id, c.name]));
    const byCategory: ExpenseCategoryTotal[] = grouped
      .map((row) => ({
        categoryId: row.categoryId,
        name: nameOf.get(row.categoryId) ?? 'Unknown',
        total: toNumber(row._sum.amount),
      }))
      .sort((a, b) => b.total - a.total);
    return {
      total: toNumber(agg._sum.amount),
      previousTotal: prev.from ? toNumber(prevAgg._sum.amount) : 0,
      count: agg._count,
      byCategory,
      topCategory: pickTopCategory(byCategory),
      daily,
    };
  }

  private async require(id: string) {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Expense ${id} not found`);
    return found;
  }
}

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}
