import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExpenseRecurrencesRepository } from './expense-recurrences.repository.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function build() {
  const tx = {
    expense: { create: jest.fn().mockResolvedValue({ id: 'exp-1' }) },
    expenseRecurrence: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  return { repo: new ExpenseRecurrencesRepository(prisma, ledger), ledger, tx };
}

const template = {
  id: 'tmpl-1',
  storeId: 'store-1',
  categoryId: 'cat-1',
  amount: D(1200),
  description: 'Rent',
  vendor: 'Landlord',
  nextDueAt: new Date('2026-11-01T00:00:00Z'),
  accountCode: 'CARD',
  createdById: 'owner-1',
};

describe('ExpenseRecurrencesRepository.spawnOccurrence', () => {
  it('posts the generated expense against the template account', async () => {
    const { repo, ledger } = build();
    await repo.spawnOccurrence({
      recurrence: template,
      createdById: 'owner-1',
      nextDueAt: new Date('2026-12-01T00:00:00Z'),
    });
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'EXPENSE',
        accountCode: 'CARD',
        amount: D('-1200'),
        expenseId: 'exp-1',
      }),
      expect.anything(),
    );
  });
});
