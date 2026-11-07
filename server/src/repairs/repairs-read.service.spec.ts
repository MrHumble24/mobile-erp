import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerRepairReadService } from '../ledger/ledger-repair-read.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsRepository } from './repairs.repository.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(['repair.read']),
};

const D = (n: number) => new Prisma.Decimal(n);

function build(repairsEnabled: boolean, storeIds = ['store-1']) {
  const repo = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    sumPayments: jest.fn().mockResolvedValue(D(0)),
    partsInRange: jest.fn().mockResolvedValue([]),
  };
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
    currentStoreIds: jest.fn().mockResolvedValue(storeIds),
  };
  const settings = { get: jest.fn().mockResolvedValue({ repairsEnabled }) };
  const ledger = {
    outsidePaid: jest.fn(),
    outsideSum: jest.fn().mockResolvedValue(D(0)),
  };
  const service = new RepairsReadService(
    repo as unknown as RepairsRepository,
    stores as unknown as StoresService,
    settings as unknown as SettingsService,
    ledger as unknown as LedgerRepairReadService,
  );
  return { service, repo, stores, ledger };
}

describe('RepairsReadService gate', () => {
  it('refuses reads when repairs are disabled', async () => {
    const { service } = build(false);
    await expect(service.list({ page: 1, pageSize: 20 })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.report(caller, {})).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lists when repairs are enabled', async () => {
    const { service } = build(true);
    const page = await service.list({ page: 1, pageSize: 20 });
    expect(page.total).toBe(0);
  });
});

describe('RepairsReadService.report store scope', () => {
  it('uses the same store set for income, parts and outside cost (multi-store)', async () => {
    const storeIds = ['store-1', 'store-2', 'store-3'];
    const { service, repo, ledger } = build(true, storeIds);
    repo.sumPayments.mockResolvedValue(D(1_000));
    repo.partsInRange.mockResolvedValue([]);
    ledger.outsideSum.mockResolvedValue(D(200));
    const report = await service.report(caller, {});
    expect(repo.sumPayments).toHaveBeenCalledWith(
      storeIds,
      undefined,
      undefined,
    );
    expect(repo.partsInRange).toHaveBeenCalledWith(
      storeIds,
      undefined,
      undefined,
    );
    expect(ledger.outsideSum).toHaveBeenCalledWith(
      undefined,
      undefined,
      storeIds,
    );
    expect(report.income).toBe('1000.00');
  });
});
