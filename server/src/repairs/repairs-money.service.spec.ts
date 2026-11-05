import { BadRequestException, ConflictException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairsMoneyService } from './repairs-money.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(['repair.payment']),
};

const D = (n: number) => new Prisma.Decimal(n);

interface PostedEntry {
  typeCode: string;
  repairPaymentId?: string;
  repairId?: string;
  amount: Prisma.Decimal;
}
const firstPost = (ledger: { post: jest.Mock }): PostedEntry =>
  ledger.post.mock.calls[0][0] as PostedEntry;

function rawFixture(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'r-1',
    ticketNumber: 1,
    statusCode: 'READY',
    agreedPrice: D(500_000),
    payments: [{ amount: D(200_000) }],
    outsideMasterName: null,
    ...over,
  };
}

function build(raw = rawFixture()) {
  const read = {
    assertEnabled: jest.fn().mockResolvedValue(undefined),
    require: jest.fn().mockResolvedValue(raw),
    get: jest.fn().mockResolvedValue({ id: 'r-1' }),
  };
  const writes = {
    transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
    createPayment: jest.fn().mockResolvedValue('pay-1'),
  };
  const ledger = {
    activeAccountCodes: jest.fn().mockResolvedValue(['CASH', 'CARD']),
    post: jest.fn().mockResolvedValue(undefined),
  };
  const shifts = { assertCanSell: jest.fn().mockResolvedValue(undefined) };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const service = new RepairsMoneyService(
    read as unknown as RepairsReadService,
    writes as unknown as RepairsWriteRepository,
    ledger as unknown as LedgerService,
    shifts as unknown as ShiftsService,
    stores as unknown as StoresService,
  );
  return { service, read, writes, ledger, shifts };
}

describe('RepairsMoneyService.addPayment', () => {
  it('takes a deposit in, posting a positive REPAIR_PAYMENT, after the shift gate', async () => {
    const { service, writes, ledger, shifts } = build();
    await service.addPayment(caller, 'r-1', {
      amount: 300_000,
      accountCode: 'CARD',
    });
    expect(shifts.assertCanSell).toHaveBeenCalledWith(caller);
    expect(writes.createPayment).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ repairId: 'r-1', accountCode: 'CARD' }),
    );
    const entry = firstPost(ledger);
    expect(entry.typeCode).toBe('REPAIR_PAYMENT');
    expect(entry.repairPaymentId).toBe('pay-1');
    expect(entry.amount.toFixed(2)).toBe('300000.00');
  });

  it('rejects a payment above the amount still owed (owed = 300000)', async () => {
    const { service, ledger } = build();
    await expect(
      service.addPayment(caller, 'r-1', {
        amount: 400_000,
        accountCode: 'CASH',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(ledger.post).not.toHaveBeenCalled();
  });

  it('rejects a payment on a terminal ticket', async () => {
    const { service } = build(rawFixture({ statusCode: 'CANCELLED' }));
    await expect(
      service.addPayment(caller, 'r-1', { amount: 1, accountCode: 'CASH' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects an unknown account', async () => {
    const { service } = build();
    await expect(
      service.addPayment(caller, 'r-1', { amount: 1, accountCode: 'BANK' }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('RepairsMoneyService.refund', () => {
  it('posts a negative REPAIR_PAYMENT capped at net paid (200000)', async () => {
    const { service, ledger } = build();
    await service.refund(caller, 'r-1', {
      amount: 999_999,
      accountCode: 'CASH',
    });
    const entry = firstPost(ledger);
    expect(entry.typeCode).toBe('REPAIR_PAYMENT');
    expect(entry.amount.toFixed(2)).toBe('-200000.00');
  });

  it('rejects when nothing has been paid', async () => {
    const { service } = build(rawFixture({ payments: [] }));
    await expect(
      service.refund(caller, 'r-1', { amount: 100, accountCode: 'CASH' }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('RepairsMoneyService.outsidePayment', () => {
  it('posts money out as REPAIR_OUTSIDE linked to the ticket', async () => {
    const { service, ledger } = build(
      rawFixture({ outsideMasterName: 'Bek Master' }),
    );
    await service.outsidePayment(caller, 'r-1', {
      amount: 150_000,
      accountCode: 'CASH',
    });
    const entry = firstPost(ledger);
    expect(entry.typeCode).toBe('REPAIR_OUTSIDE');
    expect(entry.repairId).toBe('r-1');
    expect(entry.amount.toFixed(2)).toBe('-150000.00');
  });

  it('refuses an outside payment on an own-master ticket', async () => {
    const { service, ledger } = build();
    await expect(
      service.outsidePayment(caller, 'r-1', { amount: 1, accountCode: 'CASH' }),
    ).rejects.toThrow(ConflictException);
    expect(ledger.post).not.toHaveBeenCalled();
  });
});
