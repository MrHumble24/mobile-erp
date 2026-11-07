import { StoresService } from '../stores/stores.service.js';
import { LedgerRepository } from './ledger.repository.js';
import { LedgerService } from './ledger.service.js';
import type { LedgerPost } from './types/ledger.types.js';

const STORE = 'store-1';

function build(
  overrides: Partial<Record<keyof LedgerRepository, unknown>> = {},
) {
  const repo = {
    create: jest.fn((post: LedgerPost) =>
      Promise.resolve({ id: 'row', ...post }),
    ),
    createTransfer: jest.fn((from: LedgerPost, to: LedgerPost) =>
      Promise.resolve({ from, to }),
    ),
    sumByAccount: jest.fn().mockResolvedValue([]),
    listAccounts: jest.fn().mockResolvedValue([]),
    accountExists: jest.fn().mockResolvedValue({ code: 'CASH' }),
    openingExists: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    ...overrides,
  } as unknown as LedgerRepository;
  const stores = {
    currentStoreId: () => Promise.resolve(STORE),
    currentStoreIds: () => Promise.resolve([STORE]),
  } as StoresService;
  return { service: new LedgerService(repo, stores), repo };
}

describe('LedgerService.getBalances', () => {
  it('sums rows per account including a negative balance, with a total', async () => {
    const { service } = build({
      listAccounts: jest.fn().mockResolvedValue([
        { code: 'CASH', label: 'Cash' },
        { code: 'CARD', label: 'Card' },
      ]),
      sumByAccount: jest.fn().mockResolvedValue([
        { accountCode: 'CASH', _sum: { amount: -500 } },
        { accountCode: 'CARD', _sum: { amount: 1000 } },
      ]),
    });
    const result = await service.getBalances();
    expect(result.accounts).toEqual([
      { accountCode: 'CASH', label: 'Cash', balance: '-500.00' },
      { accountCode: 'CARD', label: 'Card', balance: '1000.00' },
    ]);
    expect(result.total).toBe('500.00');
  });

  it('shows zero for an account with no rows', async () => {
    const { service } = build({
      listAccounts: jest
        .fn()
        .mockResolvedValue([{ code: 'CARD', label: 'Card' }]),
      sumByAccount: jest.fn().mockResolvedValue([]),
    });
    const result = await service.getBalances();
    expect(result.accounts[0].balance).toBe('0.00');
    expect(result.total).toBe('0.00');
  });
});

describe('LedgerService.listAccounts', () => {
  it('returns active accounts as {accountCode,label}, no amounts', async () => {
    const { service } = build({
      listAccounts: jest.fn().mockResolvedValue([
        { code: 'CASH', label: 'Cash' },
        { code: 'CARD', label: 'Card' },
      ]),
    });
    const result = await service.listAccounts();
    expect(result).toEqual([
      { accountCode: 'CASH', label: 'Cash' },
      { accountCode: 'CARD', label: 'Card' },
    ]);
  });
});

describe('LedgerService.digestBalances', () => {
  it('returns opening (before the day start) and closing (now) per account', async () => {
    const dayStart = new Date('2026-11-05T00:00:00.000Z');
    const sumByAccount = jest
      .fn()
      // first call = opening (before dayStart), second = closing (all rows)
      .mockResolvedValueOnce([
        { accountCode: 'CASH', _sum: { amount: 1000 } },
        { accountCode: 'CARD', _sum: { amount: 200 } },
      ])
      .mockResolvedValueOnce([
        { accountCode: 'CASH', _sum: { amount: 1500 } },
        { accountCode: 'CARD', _sum: { amount: 200 } },
      ]);
    const { service, repo } = build({
      listAccounts: jest.fn().mockResolvedValue([
        { code: 'CASH', label: 'Cash' },
        { code: 'CARD', label: 'Card' },
      ]),
      sumByAccount,
    });
    const result = await service.digestBalances(dayStart);
    expect(repo.sumByAccount).toHaveBeenNthCalledWith(1, STORE, dayStart);
    expect(repo.sumByAccount).toHaveBeenNthCalledWith(2, STORE);
    expect(result.accounts).toEqual([
      {
        accountCode: 'CASH',
        label: 'Cash',
        opening: '1000.00',
        closing: '1500.00',
      },
      {
        accountCode: 'CARD',
        label: 'Card',
        opening: '200.00',
        closing: '200.00',
      },
    ]);
    expect(result.openingTotal).toBe('1200.00');
    expect(result.closingTotal).toBe('1700.00');
  });

  it('shows zero opening for an account with only same-day rows', async () => {
    const { service } = build({
      listAccounts: jest
        .fn()
        .mockResolvedValue([{ code: 'CASH', label: 'Cash' }]),
      sumByAccount: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { accountCode: 'CASH', _sum: { amount: 500 } },
        ]),
    });
    const result = await service.digestBalances(new Date());
    expect(result.accounts[0].opening).toBe('0.00');
    expect(result.accounts[0].closing).toBe('500.00');
  });
});

describe('LedgerService.list cost redaction', () => {
  const rows = [
    { id: '1', typeCode: 'SALE', amount: '500.00' },
    { id: '2', typeCode: 'PURCHASE', amount: '-300.00' },
    { id: '3', typeCode: 'CUSTOMS', amount: '-50.00' },
  ];

  it('nulls cost-type amounts for a caller without the cost permission', async () => {
    const { service } = build({
      findMany: jest.fn().mockResolvedValue({ items: rows, total: 3 }),
    });
    const result = await service.list({}, false);
    expect(result.items.map((i: { amount: unknown }) => i.amount)).toEqual([
      '500.00',
      null,
      null,
    ]);
  });

  it('keeps every amount for a caller with the cost permission', async () => {
    const { service } = build({
      findMany: jest.fn().mockResolvedValue({ items: rows, total: 3 }),
    });
    const result = await service.list({}, true);
    expect(result.items.map((i: { amount: unknown }) => i.amount)).toEqual([
      '500.00',
      '-300.00',
      '-50.00',
    ]);
  });
});
