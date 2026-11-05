import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const INCLUDE = {
  category: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseRecurrenceInclude;

/** The template fields a spawn needs (a full ExpenseRecurrence row satisfies it). */
interface SpawnTemplate {
  id: string;
  storeId: string;
  categoryId: string;
  amount: Prisma.Decimal;
  description: string | null;
  vendor: string | null;
  nextDueAt: Date;
  accountCode: string;
  createdById: string;
}

/** All Prisma access for recurring-expense templates. */
@Injectable()
export class ExpenseRecurrencesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  findAll() {
    return this.prisma.expenseRecurrence.findMany({
      include: INCLUDE,
      orderBy: [{ isActive: 'desc' }, { nextDueAt: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.expenseRecurrence.findUnique({
      where: { id },
      include: INCLUDE,
    });
  }

  findDue(now: Date) {
    return this.prisma.expenseRecurrence.findMany({
      where: { isActive: true, nextDueAt: { lte: now } },
    });
  }

  create(data: Prisma.ExpenseRecurrenceUncheckedCreateInput) {
    return this.prisma.expenseRecurrence.create({ data, include: INCLUDE });
  }

  update(id: string, data: Prisma.ExpenseRecurrenceUpdateInput) {
    return this.prisma.expenseRecurrence.update({
      where: { id },
      data,
      include: INCLUDE,
    });
  }

  /**
   * Spawn one real expense from a template (incurred at its current due date),
   * post its EXPENSE row against the template's account, and advance the
   * template to `nextDueAt` — all atomically.
   */
  spawnOccurrence(input: {
    recurrence: SpawnTemplate;
    createdById: string;
    nextDueAt: Date;
  }) {
    const r = input.recurrence;
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          // A template belongs to a store; its expenses land in that store,
          // not the caller's current one.
          storeId: r.storeId,
          categoryId: r.categoryId,
          amount: r.amount,
          description: r.description,
          vendor: r.vendor,
          isRecurring: true,
          recurrenceId: r.id,
          incurredAt: r.nextDueAt,
          createdById: input.createdById,
        },
      });
      if (!r.amount.isZero()) {
        await this.ledger.post(
          {
            storeId: r.storeId,
            accountCode: r.accountCode,
            typeCode: 'EXPENSE',
            amount: r.amount.negated(),
            occurredAt: r.nextDueAt,
            expenseId: expense.id,
            createdById: input.createdById,
          },
          tx,
        );
      }
      await tx.expenseRecurrence.update({
        where: { id: r.id },
        data: { nextDueAt: input.nextDueAt },
      });
      return expense;
    });
  }
}
