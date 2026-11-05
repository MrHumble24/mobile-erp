import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import {
  deletePostings,
  ExpensePosting,
  updatePostings,
} from './lib/expense-ledger.js';
import { ExpenseDailyPoint, ExpenseFilter } from './types/expense.types.js';

type Tx = Prisma.TransactionClient;

/** Who/where/when a batch of EXPENSE rows is posted under. */
interface PostContext {
  storeId: string;
  createdById: string;
  occurredAt?: Date;
}

/** Fields an edit changes, plus the new amount/account the posting derives from. */
interface UpdateContext {
  storeId: string;
  createdById: string;
  newAmount?: Prisma.Decimal;
  newAccountCode?: string;
}

/** Scalar edit fields (amount and account are handled via UpdateContext). */
type ExpenseEditData = {
  categoryId?: string;
  description?: string;
  vendor?: string;
  isRecurring?: boolean;
  incurredAt?: Date;
};

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  private async postAll(
    tx: Tx,
    expenseId: string,
    postings: ExpensePosting[],
    ctx: PostContext,
  ) {
    for (const p of postings) {
      await this.ledger.post(
        {
          storeId: ctx.storeId,
          accountCode: p.accountCode,
          typeCode: 'EXPENSE',
          amount: p.amount,
          occurredAt: ctx.occurredAt,
          expenseId,
          createdById: ctx.createdById,
        },
        tx,
      );
    }
  }

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

  findById(id: string, storeIds: string[]) {
    return this.prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
        storeId: storeIds.length === 1 ? storeIds[0] : { in: storeIds },
      },
      include: LIST_INCLUDE,
    });
  }

  create(
    data: Omit<CreateExpenseDto, 'incurredAt' | 'accountCode'> & {
      storeId: string;
      createdById: string;
      incurredAt?: Date;
    },
    postings: ExpensePosting[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.expense.create({ data, include: LIST_INCLUDE });
      await this.postAll(tx, row.id, postings, {
        storeId: data.storeId,
        createdById: data.createdById,
        occurredAt: data.incurredAt,
      });
      return row;
    });
  }

  /**
   * Edits an expense and posts the ledger difference. The old amount and the
   * current account are read **inside** the transaction after a `FOR UPDATE`
   * lock, so two concurrent edits serialize and the ledger can never drift from
   * `expenses.amount` (ADR 0025).
   */
  update(id: string, data: ExpenseEditData, ctx: UpdateContext) {
    return this.prisma.$transaction(async (tx) => {
      const oldAmount = await this.lockAmount(tx, id);
      const currentAccount = await this.currentAccount(id);
      const newAmount = ctx.newAmount ?? oldAmount;
      const postings = updatePostings({
        oldAmount,
        newAmount,
        currentAccount,
        newAccountCode: ctx.newAccountCode,
      });
      const row = await tx.expense.update({
        where: { id },
        data:
          ctx.newAmount === undefined ? data : { ...data, amount: newAmount },
        include: LIST_INCLUDE,
      });
      await this.postAll(tx, id, postings, ctx);
      return row;
    });
  }

  /** Soft delete — keeps the row for report history, hides it from every read. */
  async softRemove(id: string, ctx: PostContext) {
    await this.prisma.$transaction(async (tx) => {
      const amount = await this.lockAmount(tx, id);
      const currentAccount = await this.currentAccount(id);
      await tx.expense.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.postAll(tx, id, deletePostings(amount, currentAccount), ctx);
    });
  }

  /** Locks the expense row (FOR UPDATE) and returns its current amount. */
  private async lockAmount(tx: Tx, id: string): Promise<Prisma.Decimal> {
    await tx.$queryRaw`SELECT id FROM expenses WHERE id = ${id} FOR UPDATE`;
    const row = await tx.expense.findUniqueOrThrow({
      where: { id },
      select: { amount: true },
    });
    return row.amount;
  }

  /** The account the expense's money currently sits against (null = pre-ledger). */
  private async currentAccount(id: string): Promise<string | null> {
    return (await this.ledger.expenseAccounts([id])).get(id) ?? null;
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

  async dailySeries(
    from?: Date,
    to?: Date,
    storeIds?: string[],
  ): Promise<ExpenseDailyPoint[]> {
    const lower = from ?? new Date(0);
    const upper = to ?? new Date();
    const storeClause =
      storeIds === undefined
        ? Prisma.empty
        : storeIds.length === 0
          ? Prisma.sql`AND 1=0`
          : Prisma.sql`AND "storeId" IN (${Prisma.join(storeIds)})`;
    const rows = await this.prisma.$queryRaw<
      { date: string; total: number }[]
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', "incurredAt"), 'YYYY-MM-DD') AS date,
             sum("amount")::float8 AS total
      FROM expenses
      WHERE "deletedAt" IS NULL
        AND "incurredAt" >= ${lower} AND "incurredAt" <= ${upper}
        ${storeClause}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((r) => ({ date: r.date, total: r.total }));
  }

  toWhere(filter: {
    storeIds?: string[];
    from?: Date;
    to?: Date;
    categoryId?: string;
    recordedById?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
  }): Prisma.ExpenseWhereInput {
    const storeId =
      filter.storeIds && filter.storeIds.length > 0
        ? filter.storeIds.length === 1
          ? filter.storeIds[0]
          : { in: filter.storeIds }
        : undefined;
    const amount =
      filter.minAmount !== undefined || filter.maxAmount !== undefined
        ? { gte: filter.minAmount, lte: filter.maxAmount }
        : undefined;
    const search = filter.search?.trim();
    return {
      deletedAt: null,
      storeId,
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
