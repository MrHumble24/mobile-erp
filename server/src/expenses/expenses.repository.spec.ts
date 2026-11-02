import { ExpensesRepository } from './expenses.repository.js';

function buildWhere(filter: Parameters<ExpensesRepository['toWhere']>[0]) {
  const repo = new ExpensesRepository(null as never);
  return repo.toWhere(filter);
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
