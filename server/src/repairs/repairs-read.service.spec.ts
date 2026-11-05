import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
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

function build(repairsEnabled: boolean) {
  const repo = { list: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
    currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
  };
  const settings = { get: jest.fn().mockResolvedValue({ repairsEnabled }) };
  const ledger = { outsidePaid: jest.fn(), outsideSum: jest.fn() };
  const service = new RepairsReadService(
    repo as unknown as RepairsRepository,
    stores as unknown as StoresService,
    settings as unknown as SettingsService,
    ledger as unknown as LedgerRepairReadService,
  );
  return { service };
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
