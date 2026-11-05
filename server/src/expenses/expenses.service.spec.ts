import { Prisma } from '../generated/client/client.js';
import { ExpensesRepository } from './expenses.repository.js';
import { ExpensesService } from './expenses.service.js';

describe('ExpensesService.summary store scoping (R2)', () => {
  it('passes active storeIds to toWhere and dailySeries so store A does not include store B', async () => {
    const toWhereCalls: Parameters<ExpensesRepository['toWhere']>[0][] = [];
    const repo = {
      toWhere: jest
        .fn()
        .mockImplementation(
          (filter: Parameters<ExpensesRepository['toWhere']>[0]) => {
            toWhereCalls.push(filter);
            return { storeId: filter.storeIds?.[0] };
          },
        ),
      sumAgg: jest.fn().mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(100) },
        _count: 1,
      }),
      sumByCategory: jest.fn().mockResolvedValue([]),
      dailySeries: jest.fn().mockResolvedValue([]),
    };
    const categories = { list: jest.fn().mockResolvedValue([]) };
    const stores = {
      currentStoreIds: jest.fn().mockResolvedValue(['store-A']),
    };
    const ledger = {};

    const service = new ExpensesService(
      repo as never,
      categories as never,
      stores as never,
      ledger as never,
    );

    const summary = await service.summary({
      from: '2026-11-01',
      to: '2026-11-05',
    });

    expect(summary).toBeDefined();
    expect(stores.currentStoreIds).toHaveBeenCalled();

    // Verify all toWhere calls included store-A
    expect(toWhereCalls.length).toBeGreaterThanOrEqual(3);
    for (const call of toWhereCalls) {
      expect(call.storeIds).toEqual(['store-A']);
    }

    // Verify dailySeries received store-A
    expect(repo.dailySeries).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      ['store-A'],
    );
  });
});
