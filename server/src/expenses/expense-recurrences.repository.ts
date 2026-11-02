import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const INCLUDE = {
  category: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseRecurrenceInclude;

/** All Prisma access for recurring-expense templates. */
@Injectable()
export class ExpenseRecurrencesRepository {
  constructor(private readonly prisma: PrismaService) {}

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
   * Spawn one real expense from a template (incurred at its current due date)
   * and advance the template to `nextDueAt`, atomically.
   */
  spawnOccurrence(input: {
    recurrence: {
      id: string;
      categoryId: string;
      amount: Prisma.Decimal;
      description: string | null;
      vendor: string | null;
      nextDueAt: Date;
      createdById: string;
    };
    createdById: string;
    nextDueAt: Date;
  }) {
    const r = input.recurrence;
    return this.prisma.$transaction([
      this.prisma.expense.create({
        data: {
          categoryId: r.categoryId,
          amount: r.amount,
          description: r.description,
          vendor: r.vendor,
          isRecurring: true,
          recurrenceId: r.id,
          incurredAt: r.nextDueAt,
          createdById: input.createdById,
        },
      }),
      this.prisma.expenseRecurrence.update({
        where: { id: r.id },
        data: { nextDueAt: input.nextDueAt },
      }),
    ]);
  }
}
