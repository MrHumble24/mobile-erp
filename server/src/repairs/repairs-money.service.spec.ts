import { BadRequestException, ConflictException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerRepairReadService } from '../ledger/ledger-repair-read.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairIdempotency } from './repair-idempotency.service.js';
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
    version: 1,
    agreedPrice: D(500_000),
    payments: [{ amount: D(200_000) }],
    outsideMasterName: null as string | null,
    outsideCost: null as Prisma.Decimal | null,
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
    bumpVersion: jest.fn().mockResolvedValue(undefined),
  };
  const ledger = {
    activeAccountCodes: jest.fn().mockResolvedValue(['CASH', 'CARD']),
    post: jest.fn().mockResolvedValue(undefined),
  };
  const shifts = { assertCanSell: jest.fn().mockResolvedValue(undefined) };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const ledgerRepair = {
    outsidePaid: jest.fn().mockResolvedValue(new Map()),
    outsideSum: jest.fn(),
  };
  const idem = {
    replay: jest.fn().mockResolvedValue(null),
    record: jest.fn().mockResolvedValue(undefined),
    findRepairIdByKey: jest.fn().mockResolvedValue(null),
  };
  const service = new RepairsMoneyService(
    read as unknown as RepairsReadService,
    writes as unknown as RepairsWriteRepository,
    ledger as unknown as LedgerService,
    shifts as unknown as ShiftsService,
    stores as unknown as StoresService,
    ledgerRepair as unknown as LedgerRepairReadService,
    idem as unknown as RepairIdempotency,
  );
  return { service, read, writes, ledger, shifts, ledgerRepair, idem };
}

const p2002 = () => Object.assign(new Error('duplicate'), { code: 'P2002' });

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
      1,
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

  it('replays the ticket when the payment key was already seen', async () => {
    const { service, idem, ledger } = build();
    const view = { id: 'r-1' };
    idem.replay.mockResolvedValue(view);
    const result = await service.addPayment(caller, 'r-1', {
      amount: 100,
      accountCode: 'CASH',
      clientMutationId: 'k-1',
    });
    expect(result).toBe(view);
    expect(ledger.post).not.toHaveBeenCalled();
  });

  it('replays on a concurrent duplicate payment key (P2002)', async () => {
    const { service, idem, read } = build();
    idem.record.mockRejectedValueOnce(p2002());
    idem.findRepairIdByKey.mockResolvedValue('r-1');
    read.get.mockResolvedValue({ id: 'r-1' });
    const result = await service.addPayment(caller, 'r-1', {
      amount: 100,
      accountCode: 'CASH',
      clientMutationId: 'k-1',
    });
    expect(result).toEqual({ id: 'r-1' });
    expect(idem.findRepairIdByKey).toHaveBeenCalledWith('k-1');
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

  it('rejects a refund on a terminal ticket', async () => {
    const { service } = build(rawFixture({ statusCode: 'CANCELLED' }));
    await expect(
      service.refund(caller, 'r-1', { amount: 1, accountCode: 'CASH' }),
    ).rejects.toThrow(ConflictException);
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

  it('rejects an outside payment on a terminal ticket', async () => {
    const { service } = build(
      rawFixture({ statusCode: 'GIVEN_BACK', outsideMasterName: 'Bek' }),
    );
    await expect(
      service.outsidePayment(caller, 'r-1', { amount: 1, accountCode: 'CASH' }),
    ).rejects.toThrow(ConflictException);
  });

  it('caps the amount at outsideCost minus already paid outside', async () => {
    const { service, ledgerRepair, ledger } = build(
      rawFixture({ outsideMasterName: 'Bek', outsideCost: D(200_000) }),
    );
    ledgerRepair.outsidePaid.mockResolvedValue(
      new Map([['r-1', D(150_000)]]),
    );
    await expect(
      service.outsidePayment(caller, 'r-1', {
        amount: 100_000,
        accountCode: 'CASH',
      }),
    ).rejects.toThrow(/50000\.00/);
    expect(ledger.post).not.toHaveBeenCalled();
  });

  it('allows an outside payment within the remaining cap', async () => {
    const { service, ledgerRepair, ledger } = build(
      rawFixture({ outsideMasterName: 'Bek', outsideCost: D(200_000) }),
    );
    ledgerRepair.outsidePaid.mockResolvedValue(
      new Map([['r-1', D(150_000)]]),
    );
    await service.outsidePayment(caller, 'r-1', {
      amount: 30_000,
      accountCode: 'CASH',
    });
    expect(firstPost(ledger).amount.toFixed(2)).toBe('-30000.00');
  });
});
