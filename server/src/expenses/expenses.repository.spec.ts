import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExpensesRepository } from './expenses.repository.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function buildWhere(filter: Parameters<ExpensesRepository['toWhere']>[0]) {
  const repo = new ExpensesRepository(null as never, null as never);
  return repo.toWhere(filter);
}

function buildRepo(lockedAmount: number, account: string | null) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'e1' }]),
    expense: {
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ amount: D(lockedAmount) }),
      update: jest.fn().mockResolvedValue({ id: 'e1' }),
    },
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = {
    post: jest.fn(),
    expenseAccounts: jest
      .fn()
      .mockResolvedValue(account ? new Map([['e1', account]]) : new Map()),
  } as unknown as LedgerService;
  return { repo: new ExpensesRepository(prisma, ledger), ledger, tx };
}

describe('ExpensesRepository.toWhere', () => {
  it('always excludes soft-deleted rows', () => {
    expect(buildWhere({}).deletedAt).toBeNull();
  });

  it('maps recordedById to createdById and passes categoryId through', () => {
    const where = buildWhere({ recordedById: 'u1', categoryId: 'c1' });
    expect(where.createdById).toBe('u1');
    expect(where.categoryId).toBe('c1');
  });

  it('builds an amount range only when a bound is given', () => {
    expect(buildWhere({}).amount).toBeUndefined();
    expect(buildWhere({ minAmount: 5, maxAmount: 10 }).amount).toEqual({
      gte: 5,
      lte: 10,
    });
  });

  it('builds a date range only when a bound is given', () => {
    const from = new Date('2026-01-01');
    expect(buildWhere({ from }).incurredAt).toEqual({
      gte: from,
      lte: undefined,
    });
    expect(buildWhere({}).incurredAt).toBeUndefined();
  });

  it('searches description and vendor case-insensitively, trimmed', () => {
    expect(buildWhere({ search: '  rent ' }).OR).toEqual([
      { description: { contains: 'rent', mode: 'insensitive' } },
      { vendor: { contains: 'rent', mode: 'insensitive' } },
    ]);
    expect(buildWhere({ search: '   ' }).OR).toBeUndefined();
  });
});

describe('ExpensesRepository.update (lost-update lock)', () => {
  it('locks the row and posts the diff from the DB amount, not a stale read', async () => {
    const { repo, ledger, tx } = buildRepo(100, 'CASH');
    await repo.update(
      'e1',
      {},
      { storeId: 's1', createdById: 'u1', newAmount: D(150) },
    );
    // FOR UPDATE lock taken before the amount is read.
    expect(tx.$queryRaw).toHaveBeenCalled();
    // diff = old(100) - new(150) = -50 (more money out) on the current account.
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({ accountCode: 'CASH', amount: D('-50') }),
      expect.anything(),
    );
  });
});

describe('ExpensesRepository.softRemove (lost-update lock)', () => {
  it('locks the row and reverses the full locked amount', async () => {
    const { repo, ledger, tx } = buildRepo(80, 'CARD');
    await repo.softRemove('e1', { storeId: 's1', createdById: 'u1' });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({ accountCode: 'CARD', amount: D('80') }),
      expect.anything(),
    );
  });
});
