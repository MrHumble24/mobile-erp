import { ForbiddenException } from '@nestjs/common';
import { DestructiveLockService } from '../common/runtime/destructive-lock.service.js';
import { RestoreService, type RestoreRequest } from './restore.service.js';
import {
  RESTORE_CONFIRM_FAILED,
  RESTORE_RUNNING,
} from './types/backup.types.js';

function make(over: {
  storeName?: string;
  passwordOk?: boolean;
  manualRecovery?: boolean;
  backupRunning?: boolean;
  lock?: DestructiveLockService;
}) {
  const repo = {
    listRuns: jest
      .fn()
      .mockResolvedValue([{ id: 'safety', fileName: 's.mbk' }]),
  };
  const restoreRepo = {
    createRestoreRun: jest.fn().mockResolvedValue({ id: 'r1' }),
    upsertRestoreOutcome: jest.fn().mockResolvedValue(undefined),
    latestRestoreRun: jest.fn().mockResolvedValue(null),
  };
  const backups = {
    startBackup: jest.fn(),
    download: jest.fn(),
    isRunning: () => over.backupRunning ?? false,
  };
  const runner = {
    passphrase: jest.fn().mockResolvedValue('pw'),
    passphraseStatus: jest.fn(),
  };
  const restoreRunner = { perform: jest.fn() };
  const stores = {
    list: jest
      .fn()
      .mockResolvedValue([{ name: over.storeName ?? 'Malika Bazaar' }]),
  };
  const auth = {
    verifyPassword: jest.fn().mockResolvedValue(over.passwordOk ?? true),
  };
  const recovery = {
    needsManualRecovery: () => over.manualRecovery ?? false,
    restoreInProgress: () => false,
  };
  const lock = over.lock ?? new DestructiveLockService();
  const svc = new RestoreService(
    repo as never,
    restoreRepo as never,
    backups as never,
    runner as never,
    restoreRunner as never,
    stores as never,
    auth as never,
    recovery as never,
    lock,
  );
  return { svc, repo, restoreRepo, backups, lock };
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
    const { svc, restoreRepo, backups } = make({ storeName: 'Malika Bazaar' });
    await expect(svc.restore(req('Wrong Shop'))).rejects.toMatchObject({
      response: { code: RESTORE_CONFIRM_FAILED },
    });
    expect(restoreRepo.createRestoreRun).not.toHaveBeenCalled();
    expect(backups.startBackup).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with 403', async () => {
    const { svc } = make({ passwordOk: false });
    await expect(svc.restore(req('Malika Bazaar'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('refuses to start while manual recovery is pending (RESTORE_RUNNING)', async () => {
    const { svc, restoreRepo } = make({ manualRecovery: true });
    await expect(svc.restore(req('Malika Bazaar'))).rejects.toMatchObject({
      response: { code: 'RESTORE_RUNNING' },
    });
    expect(restoreRepo.createRestoreRun).not.toHaveBeenCalled();
  });

  it('refuses while an erase holds the destructive latch (RESTORE_RUNNING)', async () => {
    const lock = new DestructiveLockService();
    lock.tryAcquire('wipe');
    const { svc, restoreRepo } = make({ lock });
    await expect(svc.restore(req('Malika Bazaar'))).rejects.toMatchObject({
      response: { code: RESTORE_RUNNING },
    });
    expect(restoreRepo.createRestoreRun).not.toHaveBeenCalled();
    expect(lock.heldBy()).toBe('wipe'); // not released by the refused restore
  });

  it('refuses while a plain backup runs (RESTORE_RUNNING)', async () => {
    const { svc } = make({ backupRunning: true });
    await expect(svc.restore(req('Malika Bazaar'))).rejects.toMatchObject({
      response: { code: RESTORE_RUNNING },
    });
  });
});
