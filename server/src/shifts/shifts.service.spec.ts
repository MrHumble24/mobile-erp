import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { NO_OPEN_SHIFT, ShiftsService } from './shifts.service.js';

const D = (v: number) => new Prisma.Decimal(v);
const caller = (id = 'u1') => ({
  id,
  email: 'c@x',
  permissions: new Set<string>(),
});

function openShiftRow(over: Record<string, unknown> = {}) {
  return {
    id: 's1',
    storeId: 'store1',
    cashierId: 'u1',
    openedAt: new Date('2026-11-05T08:00:00Z'),
    openingCount: D(500_000),
    closedAt: null,
    closingCount: null,
    note: null,
    cashier: { id: 'u1', profile: { firstName: 'Cash', lastName: 'Ier' } },
    ...over,
  };
}

function build() {
  const repo = {
    findOpenByCashier: jest.fn(),
    findById: jest.fn(),
    open: jest.fn(),
    close: jest.fn().mockResolvedValue({ count: 1 }),
    runInTransaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({}),
    ),
  };
  const read = { buildReport: jest.fn().mockResolvedValue({ id: 's1' }) };
  const ledger = {
    shiftRows: jest.fn().mockResolvedValue([]),
    post: jest.fn(),
  };
  const settings = {
    get: jest.fn().mockResolvedValue({ shiftsEnabled: true }),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store1') };
  const service = new ShiftsService(
    repo as never,
    read as never,
    ledger as never,
    settings as never,
    stores as never,
  );
  return { service, repo, read, ledger, settings, stores };
}

describe('ShiftsService.open', () => {
  it('rejects a second open shift for the same cashier', async () => {
    const { service, repo } = build();
    repo.findOpenByCashier.mockResolvedValue(openShiftRow());
    await expect(service.open(caller(), { openingCount: 1 })).rejects.toThrow(
      ConflictException,
    );
    expect(repo.open).not.toHaveBeenCalled();
  });

  it('opens when the cashier has none open (checks by caller id, so two cashiers may each open)', async () => {
    const { service, repo } = build();
    repo.findOpenByCashier.mockResolvedValue(null); // nothing open for THIS cashier
    repo.open.mockResolvedValue(openShiftRow());
    await service.open(caller('u2'), { openingCount: 500_000 });
    expect(repo.findOpenByCashier).toHaveBeenCalledWith('u2');
    expect(repo.open).toHaveBeenCalledWith('store1', 'u2', D(500_000));
  });
});

describe('ShiftsService.close', () => {
  it('posts exactly one SHIFT_DIFFERENCE row when the drawer does not match', async () => {
    const { service, repo, ledger } = build();
    repo.findOpenByCashier.mockResolvedValue(openShiftRow());
    repo.findById.mockResolvedValue(openShiftRow({ closedAt: new Date() }));
    // one 200,000 cash sale → expected 700,000; count 680,000 → −20,000 diff
    ledger.shiftRows.mockResolvedValue([
      { typeCode: 'SALE', accountCode: 'CASH', amount: D(200_000) },
    ]);
    await service.close(caller(), { closingCount: 680_000 });
    expect(ledger.post).toHaveBeenCalledTimes(1);
    const entry = ledger.post.mock.calls[0][0];
    expect(entry.typeCode).toBe('SHIFT_DIFFERENCE');
    expect(entry.accountCode).toBe('CASH');
    expect(entry.amount).toBe(-20_000);
    expect(entry.shiftId).toBe('s1');
  });

  it('posts no SHIFT_DIFFERENCE row when the drawer matches exactly', async () => {
    const { service, repo, ledger } = build();
    repo.findOpenByCashier.mockResolvedValue(openShiftRow());
    repo.findById.mockResolvedValue(openShiftRow({ closedAt: new Date() }));
    ledger.shiftRows.mockResolvedValue([
      { typeCode: 'SALE', accountCode: 'CASH', amount: D(200_000) },
    ]);
    await service.close(caller(), { closingCount: 700_000 });
    expect(ledger.post).not.toHaveBeenCalled();
  });

  it('rejects closing when the cashier has no open shift', async () => {
    const { service, repo } = build();
    repo.findOpenByCashier.mockResolvedValue(null);
    await expect(service.close(caller(), { closingCount: 1 })).rejects.toThrow(
      /no open shift/i,
    );
  });
});

describe('ShiftsService.forceClose', () => {
  it('rejects a shift that is already closed', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(openShiftRow({ closedAt: new Date() }));
    await expect(
      service.forceClose(caller('admin'), 's1', { closingCount: 1, note: 'x' }),
    ).rejects.toThrow(ConflictException);
  });

  it("closes another cashier's open shift", async () => {
    const { service, repo, ledger } = build();
    repo.findById
      .mockResolvedValueOnce(openShiftRow()) // open, to close
      .mockResolvedValueOnce(openShiftRow({ closedAt: new Date() })); // re-read
    ledger.shiftRows.mockResolvedValue([]);
    await service.forceClose(caller('admin'), 's1', {
      closingCount: 500_000,
      note: 'forgotten',
    });
    expect(repo.close).toHaveBeenCalled();
  });
});

describe('ShiftsService.assertCanSell', () => {
  it('allows selling when shifts are off, even with no open shift', async () => {
    const { service, settings, repo } = build();
    settings.get.mockResolvedValue({ shiftsEnabled: false });
    repo.findOpenByCashier.mockResolvedValue(null);
    await expect(service.assertCanSell(caller())).resolves.toBeUndefined();
  });

  it('rejects with NO_OPEN_SHIFT when shifts are on and none is open', async () => {
    const { service, repo } = build();
    repo.findOpenByCashier.mockResolvedValue(null);
    await expect(service.assertCanSell(caller())).rejects.toMatchObject({
      response: { code: NO_OPEN_SHIFT },
    });
  });

  it('allows selling when shifts are on and a shift is open', async () => {
    const { service, repo } = build();
    repo.findOpenByCashier.mockResolvedValue(openShiftRow());
    await expect(service.assertCanSell(caller())).resolves.toBeUndefined();
  });

  it('never rejects an offline replay (fromSync)', async () => {
    const { service, repo, settings } = build();
    await expect(
      service.assertCanSell(caller(), { fromSync: true }),
    ).resolves.toBeUndefined();
    expect(settings.get).not.toHaveBeenCalled();
    expect(repo.findOpenByCashier).not.toHaveBeenCalled();
  });
});
