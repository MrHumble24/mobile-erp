import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toNumber } from '../common/lib/to-number.js';
import { ExpenseCategoriesService } from '../expense-categories/expense-categories.service.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import {
  ExpenseQueryDto,
  ExpenseSummaryQueryDto,
} from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpensesRepository } from './expenses.repository.js';
import { createPostings } from './lib/expense-ledger.js';
import { pickTopCategory, previousPeriod } from './lib/summary.lib.js';
import { ExpenseCategoryTotal, ExpenseSummary } from './types/expense.types.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly repo: ExpensesRepository,
    private readonly categories: ExpenseCategoriesService,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
  ) {}

  async list(query: ExpenseQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const storeIds = await this.stores.currentStoreIds();
    const { items, total } = await this.repo.findMany({
      storeIds,
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
    return { items: await this.withAccount(items), total, page, pageSize };
  }

  async get(id: string) {
    return (await this.withAccount([await this.require(id)]))[0];
  }

  async create(createdById: string, dto: CreateExpenseDto) {
    const { incurredAt, accountCode, ...rest } = dto;
    const account = await this.resolveAccount(accountCode);
    const row = await this.repo.create(
      {
        ...rest,
        storeId: await this.stores.currentStoreId(),
        createdById,
        incurredAt: parseDate(incurredAt),
      },
      createPostings(dto.amount, account),
    );
    return (await this.withAccount([row]))[0];
  }

  async update(createdById: string, id: string, dto: UpdateExpenseDto) {
    const current = await this.require(id);
    if (dto.accountCode) await this.resolveAccount(dto.accountCode);
    const { incurredAt, accountCode, amount, categoryId, ...rest } = dto;
    // The old amount and current account are read under a FOR UPDATE lock
    // inside the repository transaction (ADR 0025) so concurrent edits serialize.
    const row = await this.repo.update(
      id,
      { ...rest, categoryId, incurredAt: parseDate(incurredAt) },
      {
        storeId: current.storeId,
        createdById,
        newAmount:
          amount === undefined ? undefined : new Prisma.Decimal(amount),
        newAccountCode: accountCode,
      },
    );
    return (await this.withAccount([row]))[0];
  }

  async remove(createdById: string, id: string) {
    const current = await this.require(id);
    await this.repo.softRemove(id, { storeId: current.storeId, createdById });
  }

  /** CASH default; reject an unknown or inactive account. */
  private async resolveAccount(code?: string): Promise<string> {
    const account = code ?? 'CASH';
    if (!(await this.ledger.activeAccountCodes()).includes(account)) {
      throw new BadRequestException(`Unknown or inactive account ${account}`);
    }
    return account;
  }

  /** Decorate rows with the derived account (CASH when there are no rows). */
  private async withAccount<T extends { id: string }>(
    rows: T[],
  ): Promise<(T & { accountCode: string })[]> {
    if (rows.length === 0) return [];
    const map = await this.ledger.expenseAccounts(rows.map((r) => r.id));
    return rows.map((r) => ({ ...r, accountCode: map.get(r.id) ?? 'CASH' }));
  }

  async summary(query: ExpenseSummaryQueryDto): Promise<ExpenseSummary> {
    const storeIds = await this.stores.currentStoreIds();
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const prev = previousPeriod(from, to);
    const [agg, prevAgg, grouped, categories, daily] = await Promise.all([
      this.repo.sumAgg(this.repo.toWhere({ storeIds, from, to })),
      this.repo.sumAgg(
        this.repo.toWhere({ storeIds, from: prev.from, to: prev.to }),
      ),
      this.repo.sumByCategory(this.repo.toWhere({ storeIds, from, to })),
      this.categories.list(),
      this.repo.dailySeries(from, to, storeIds),
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
    const storeIds = await this.stores.currentStoreIds();
    const found = await this.repo.findById(id, storeIds);
    if (!found) throw new NotFoundException(`Expense ${id} not found`);
    return found;
  }
}

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}
