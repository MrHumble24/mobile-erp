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
