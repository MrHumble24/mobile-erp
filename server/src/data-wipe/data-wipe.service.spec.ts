import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataWipeService, type WipeRequest } from './data-wipe.service.js';
import {
  DATA_WIPE_CONFIRM_FAILED,
  DATA_WIPE_NO_PASSPHRASE,
  DATA_WIPE_RUNNING,
} from './types/data-wipe.types.js';

function make(
  over: {
    storeName?: string;
    passwordOk?: boolean;
    manualRecovery?: boolean;
    backupRunning?: boolean;
    passphraseStatus?: 'set' | 'missing' | 'unreadable';
    backupFails?: boolean;
    performHangs?: boolean;
  } = {},
) {
  let releasePerform: (() => void) | undefined;
  const repo = {
    catalogImageFileNames: jest.fn().mockResolvedValue([]),
    createRun: jest.fn().mockResolvedValue({ id: 'w1' }),
    finishRun: jest.fn().mockResolvedValue(undefined),
    latestRun: jest.fn().mockResolvedValue(null),
  };
  const runner = {
    perform: jest.fn().mockImplementation(() =>
      over.performHangs
        ? new Promise<Record<string, number>>((r) => {
            releasePerform = () => r({});
          })
        : Promise.resolve({ sales: 1 }),
    ),
  };
  const backups = {
    isRunning: jest.fn().mockReturnValue(over.backupRunning ?? false),
    getSettings: jest
      .fn()
      .mockResolvedValue({ passphraseStatus: over.passphraseStatus ?? 'set' }),
    startBackup: over.backupFails
      ? jest.fn().mockRejectedValue(new Error('backup boom'))
      : jest.fn().mockResolvedValue(undefined),
  };
  const backupsRepo = {
    listRuns: jest
      .fn()
      .mockResolvedValue([{ id: 'safety', fileName: 's.mbk' }]),
  };
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
  const images = { remove: jest.fn().mockResolvedValue(undefined) };
  const telegram = { send: jest.fn().mockResolvedValue(undefined) };
  const svc = new DataWipeService(
    repo as never,
    runner as never,
    backups as never,
    backupsRepo as never,
    stores as never,
    auth as never,
    recovery as never,
    images as never,
    telegram as never,
  );
  return { svc, repo, runner, backups, release: () => releasePerform?.() };
}

const req = (over: Partial<WipeRequest> = {}): WipeRequest => ({
  performedById: 'u1',
  email: 'owner@x',
  shopName: 'Malika Bazaar',
  password: 'pw',
  contacts: false,
  catalog: false,
  ...over,
});

describe('DataWipeService order of work', () => {
  it('rejects a wrong shop name before touching anything (403)', async () => {
    const { svc, repo, backups } = make({ storeName: 'Malika Bazaar' });
    await expect(svc.wipe(req({ shopName: 'Wrong' }))).rejects.toMatchObject({
      response: { code: DATA_WIPE_CONFIRM_FAILED },
    });
    expect(repo.createRun).not.toHaveBeenCalled();
    expect(backups.startBackup).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with 403', async () => {
    const { svc } = make({ passwordOk: false });
    await expect(svc.wipe(req())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses while manual recovery is pending (409)', async () => {
    const { svc, backups } = make({ manualRecovery: true });
    await expect(svc.wipe(req())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
    expect(backups.startBackup).not.toHaveBeenCalled();
  });

  it('refuses while a backup is running (409)', async () => {
    const { svc } = make({ backupRunning: true });
    await expect(svc.wipe(req())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
  });

  it('refuses when no passphrase is set — nothing erased', async () => {
    const { svc, runner, repo } = make({ passphraseStatus: 'missing' });
    await expect(svc.wipe(req())).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.wipe(req())).rejects.toMatchObject({
      response: { code: DATA_WIPE_NO_PASSPHRASE },
    });
    expect(runner.perform).not.toHaveBeenCalled();
    expect(repo.createRun).not.toHaveBeenCalled();
  });

  it('erases nothing when the safety backup fails', async () => {
    const { svc, runner } = make({ backupFails: true });
    await expect(svc.wipe(req())).rejects.toThrow('backup boom');
    expect(runner.perform).not.toHaveBeenCalled();
  });

  it('refuses a second erase while one is running (409)', async () => {
    const { svc, release } = make({ performHangs: true });
    const first = svc.wipe(req());
    await new Promise((r) => setImmediate(r));
    await expect(svc.wipe(req())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
    release();
    await first;
  });
});
