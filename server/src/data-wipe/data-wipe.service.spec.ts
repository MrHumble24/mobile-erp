import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DestructiveLockService } from '../common/runtime/destructive-lock.service.js';
import {
  DataWipeService,
  type ResetRequest,
  type WipeRequest,
} from './data-wipe.service.js';
import {
  DATA_WIPE_CONFIRM_FAILED,
  DATA_WIPE_NO_PASSPHRASE,
  DATA_WIPE_RUNNING,
  DATA_WIPE_SAFETY_BACKUP_FAILED,
} from './types/data-wipe.types.js';

function make(
  over: {
    storeName?: string;
    passwordOk?: boolean;
    manualRecovery?: boolean;
    backupRunning?: boolean;
    passphraseStatus?: 'set' | 'missing' | 'unreadable';
    backupFails?: boolean;
    safetyBackupInvalid?: boolean;
    finishThrows?: boolean;
    performHangs?: boolean;
    lock?: DestructiveLockService;
  } = {},
) {
  let releasePerform: (() => void) | undefined;
  const repo = {
    catalogImageFileNames: jest.fn().mockResolvedValue(['pic.jpg']),
    createRun: jest.fn().mockResolvedValue({ id: 'w1' }),
    finishRun: over.finishThrows
      ? jest.fn().mockRejectedValue(new Error('audit write boom'))
      : jest.fn().mockResolvedValue(undefined),
    latestRun: jest.fn().mockResolvedValue(null),
    markStaleRunsFailed: jest.fn().mockResolvedValue({ count: 0 }),
  };
  const runner = {
    perform: jest.fn().mockImplementation(() =>
      over.performHangs
        ? new Promise<Record<string, number>>((r) => {
            releasePerform = () => r({});
          })
        : Promise.resolve({ sales: 1 }),
    ),
    performReset: jest.fn().mockImplementation(() =>
      over.performHangs
        ? new Promise<Record<string, number>>((r) => {
            releasePerform = () => r({});
          })
        : Promise.resolve({ users: 1 }),
    ),
  };
  const backups = {
    isRunning: jest.fn().mockReturnValue(over.backupRunning ?? false),
    getSettings: jest
      .fn()
      .mockResolvedValue({ passphraseStatus: over.passphraseStatus ?? 'set' }),
    startBackup: over.backupFails
      ? jest.fn().mockRejectedValue(new Error('backup boom'))
      : jest.fn().mockResolvedValue('safety-1'),
    verifyBackup: over.safetyBackupInvalid
      ? jest.fn().mockRejectedValue(new Error('cannot open'))
      : jest.fn().mockResolvedValue(undefined),
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
  const lock = over.lock ?? new DestructiveLockService();
  const setup = { prepareSetupAfterReset: jest.fn().mockReturnValue('CODE') };
  const svc = new DataWipeService(
    repo as never,
    runner as never,
    backups as never,
    stores as never,
    auth as never,
    recovery as never,
    images as never,
    telegram as never,
    lock,
    setup as never,
  );
  return {
    svc,
    repo,
    runner,
    backups,
    images,
    telegram,
    lock,
    setup,
    release: () => releasePerform?.(),
  };
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

const resetReq = (over: Partial<ResetRequest> = {}): ResetRequest => ({
  performedById: 'u1',
  email: 'owner@x',
  shopName: 'Malika Bazaar',
  password: 'pw',
  sentence: 'erase everything',
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

  it('erases nothing when the safety backup will not open (M2)', async () => {
    const { svc, runner, repo } = make({ safetyBackupInvalid: true });
    await expect(svc.wipe(req())).rejects.toMatchObject({
      response: { code: DATA_WIPE_SAFETY_BACKUP_FAILED },
    });
    expect(runner.perform).not.toHaveBeenCalled();
    expect(repo.createRun).not.toHaveBeenCalled();
  });

  it('refuses while a restore holds the destructive latch (409, S1)', async () => {
    const lock = new DestructiveLockService();
    lock.tryAcquire('restore');
    const { svc, backups } = make({ lock });
    await expect(svc.wipe(req())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
    expect(backups.startBackup).not.toHaveBeenCalled();
    expect(lock.heldBy()).toBe('restore');
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

  it('a committed erase is not turned into an error if the audit write fails (L1)', async () => {
    const { svc, images, telegram } = make({
      finishThrows: true,
      catalog: true,
    } as never);
    await expect(svc.wipe(req({ catalog: true }))).resolves.toBeUndefined();
    expect(images.remove).toHaveBeenCalledWith('pic.jpg');
    expect(telegram.send).toHaveBeenCalled();
  });
});

describe('DataWipeService factory reset refusals and execution', () => {
  it('refuses factory reset with wrong shop name (403)', async () => {
    const { svc } = make({ storeName: 'Malika Bazaar' });
    await expect(
      svc.reset(resetReq({ shopName: 'Other' })),
    ).rejects.toMatchObject({
      response: { code: DATA_WIPE_CONFIRM_FAILED },
    });
  });

  it('refuses factory reset with wrong password (403)', async () => {
    const { svc } = make({ passwordOk: false });
    await expect(svc.reset(resetReq())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('refuses factory reset with missing or wrong sentence (400)', async () => {
    const { svc } = make();
    await expect(
      svc.reset(resetReq({ sentence: 'not the right phrase' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses factory reset when no backup passphrase is set (400)', async () => {
    const { svc } = make({ passphraseStatus: 'missing' });
    await expect(svc.reset(resetReq())).rejects.toMatchObject({
      response: { code: DATA_WIPE_NO_PASSPHRASE },
    });
  });

  it('refuses factory reset while a backup is running (409)', async () => {
    const { svc } = make({ backupRunning: true });
    await expect(svc.reset(resetReq())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
  });

  it('refuses factory reset while an erase holds the latch (409)', async () => {
    const lock = new DestructiveLockService();
    lock.tryAcquire('wipe');
    const { svc } = make({ lock });
    await expect(svc.reset(resetReq())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
    expect(lock.heldBy()).toBe('wipe');
  });

  it('refuses two resets at once: one wins, one 409', async () => {
    const { svc, release } = make({ performHangs: true });
    const first = svc.reset(resetReq());
    await new Promise((r) => setImmediate(r));
    await expect(svc.reset(resetReq())).rejects.toMatchObject({
      response: { code: DATA_WIPE_RUNNING },
    });
    release();
    await first;
  });

  it('successful reset executes performReset and prepares setup code', async () => {
    const { svc, runner, setup } = make();
    await expect(svc.reset(resetReq())).resolves.toBeUndefined();
    expect(runner.performReset).toHaveBeenCalled();
    expect(setup.prepareSetupAfterReset).toHaveBeenCalled();
  });
});
