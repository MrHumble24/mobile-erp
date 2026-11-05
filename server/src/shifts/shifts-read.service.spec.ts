import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { ShiftsReadService } from './shifts-read.service.js';

const D = (v: number) => new Prisma.Decimal(v);

function shiftRow(cashierId: string) {
  return {
    id: 's1',
    storeId: 'store1',
    cashierId,
    openedAt: new Date('2026-11-05T08:00:00Z'),
    openingCount: D(500_000),
    closedAt: null,
    closingCount: null,
    note: null,
    cashier: { id: cashierId, profile: { firstName: 'A', lastName: 'B' } },
  };
}

function build() {
  const repo = { findById: jest.fn(), list: jest.fn() };
  const ledger = {
    shiftRows: jest.fn().mockResolvedValue([]),
    shiftDifferences: jest.fn().mockResolvedValue(new Map()),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store1') };
  const service = new ShiftsReadService(
    repo as never,
    ledger as never,
    stores as never,
  );
  return { service, repo, ledger, stores };
}

const user = (id: string, perms: string[] = []) => ({
  id,
  email: 'x',
  permissions: new Set(perms),
});

describe('ShiftsReadService.report', () => {
  it("a cashier cannot read another cashier's shift", async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(shiftRow('other'));
    await expect(service.report(user('me'), 's1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('shift.manage may read any shift', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(shiftRow('other'));
    await expect(
      service.report(user('me', ['shift.manage']), 's1'),
    ).resolves.toBeDefined();
  });

  it('404s an unknown shift', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(null);
    await expect(service.report(user('me'), 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('ShiftsReadService.list', () => {
  it('forces the cashier filter to the caller without shift.manage', async () => {
    const { service, repo } = build();
    repo.list.mockResolvedValue({ items: [], total: 0 });
    await service.list(user('me'), { cashierId: 'someone-else' });
    expect(repo.list).toHaveBeenCalledWith(
      expect.objectContaining({ cashierId: 'me' }),
    );
  });

  it('honours the cashier filter with shift.manage (all cashiers)', async () => {
    const { service, repo } = build();
    repo.list.mockResolvedValue({ items: [], total: 0 });
    await service.list(user('owner', ['shift.manage']), {
      cashierId: 'someone-else',
    });
    expect(repo.list).toHaveBeenCalledWith(
      expect.objectContaining({ cashierId: 'someone-else' }),
    );
  });
});
