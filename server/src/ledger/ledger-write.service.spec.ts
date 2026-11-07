import { BadRequestException, ConflictException } from '@nestjs/common';
import { StoresService } from '../stores/stores.service.js';
import { LedgerRepository } from './ledger.repository.js';
import { LedgerWriteService } from './ledger-write.service.js';
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
  const service = new LedgerWriteService(
    repo,
    stores,
    new LedgerService(repo, stores),
  );
  return { service, repo };
}

describe('LedgerWriteService.createEntry', () => {
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

describe('LedgerWriteService.transfer', () => {
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
