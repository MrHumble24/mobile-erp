import { BadRequestException, ConflictException } from '@nestjs/common';
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

describe('LedgerService.createEntry', () => {
  it('signs a withdrawal negative before persisting', async () => {
    const { service, repo } = build();
    await service.createEntry('user-1', {
      accountCode: 'CASH',
      typeCode: 'WITHDRAWAL',
      amount: 300,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -300,
        storeId: STORE,
        createdById: 'user-1',
      }),
      undefined,
    );
  });

  it('rejects a second opening on the same account', async () => {
    const { service } = build({
      openingExists: jest.fn().mockResolvedValue({ id: 'existing' }),
    });
    await expect(
      service.createEntry('user-1', {
        accountCode: 'CASH',
        typeCode: 'OPENING',
        amount: 1000,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects an unknown account', async () => {
    const { service } = build({
      accountExists: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.createEntry('user-1', {
        accountCode: 'NOPE',
        typeCode: 'DEPOSIT',
        amount: 10,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('turns a racing second OPENING (P2002) into a 409, not a 500', async () => {
    const { service } = build({
      // check passes (no opening yet) but the insert trips the partial index
      openingExists: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockRejectedValue({ code: 'P2002' }),
    });
    await expect(
      service.createEntry('user-1', {
        accountCode: 'CASH',
        typeCode: 'OPENING',
        amount: 1000,
      }),
    ).rejects.toThrow(ConflictException);
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

describe('LedgerService.transfer', () => {
  it('writes two rows that sum to zero and share a transferId', async () => {
    const { service, repo } = build();
    await service.transfer('user-1', {
      fromAccountCode: 'CASH',
      toAccountCode: 'CARD',
      amount: 250,
    });
    const [from, to] = (repo.createTransfer as jest.Mock).mock.calls[0];
    expect(from.amount + to.amount).toBe(0);
    expect(from.amount).toBe(-250);
    expect(to.amount).toBe(250);
    expect(from.transferId).toBe(to.transferId);
    expect(from.transferId).toBeTruthy();
    expect(from.accountCode).toBe('CASH');
    expect(to.accountCode).toBe('CARD');
  });

  it('rejects a transfer to the same account', async () => {
    const { service, repo } = build();
    await expect(
      service.transfer('user-1', {
        fromAccountCode: 'CASH',
        toAccountCode: 'CASH',
        amount: 100,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.createTransfer).not.toHaveBeenCalled();
  });
});
