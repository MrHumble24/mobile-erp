import { ForbiddenException } from '@nestjs/common';
import { RestoreService, type RestoreRequest } from './restore.service.js';
import { RESTORE_CONFIRM_FAILED } from './types/backup.types.js';

function make(over: {
  storeName?: string;
  passwordOk?: boolean;
  maintenanceActive?: boolean;
}) {
  const repo = {
    createRestoreRun: jest.fn().mockResolvedValue({ id: 'r1' }),
    finishRestoreRun: jest.fn().mockResolvedValue(undefined),
    listRuns: jest.fn().mockResolvedValue([{ id: 'safety' }]),
  };
  const backups = { startBackup: jest.fn(), download: jest.fn() };
  const runner = { passphrase: jest.fn().mockResolvedValue('pw') };
  const stores = {
    list: jest
      .fn()
      .mockResolvedValue([{ name: over.storeName ?? 'Malika Bazaar' }]),
  };
  const auth = {
    verifyPassword: jest.fn().mockResolvedValue(over.passwordOk ?? true),
  };
  const maintenance = {
    active: over.maintenanceActive ?? false,
    isActive() {
      return this.active;
    },
    begin: jest.fn(),
    end: jest.fn(),
  };
  const sessions = { endAllSessions: jest.fn() };
  const svc = new RestoreService(
    repo as never,
    backups as never,
    runner as never,
    stores as never,
    auth as never,
    maintenance as never,
    sessions as never,
  );
  return { svc, repo, backups, maintenance };
}

const req = (shopName: string): RestoreRequest => ({
  performedById: 'u1',
  email: 'owner@x',
  shopName,
  password: 'pw',
  source: { runId: 'b1' },
});

describe('RestoreService confirmation', () => {
  it('rejects a wrong shop name before touching anything', async () => {
    const { svc, repo, backups } = make({ storeName: 'Malika Bazaar' });
    await expect(svc.restore(req('Wrong Shop'))).rejects.toMatchObject({
      response: { code: RESTORE_CONFIRM_FAILED },
    });
    expect(repo.createRestoreRun).not.toHaveBeenCalled();
    expect(backups.startBackup).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with 403', async () => {
    const { svc } = make({ passwordOk: false });
    await expect(svc.restore(req('Malika Bazaar'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not start a restore while maintenance is already active', async () => {
    const { svc, repo } = make({ maintenanceActive: true });
    await expect(svc.restore(req('Malika Bazaar'))).rejects.toMatchObject({
      response: { code: 'RESTORE_RUNNING' },
    });
    expect(repo.createRestoreRun).not.toHaveBeenCalled();
  });
});
