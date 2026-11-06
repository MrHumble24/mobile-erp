import { ConflictException } from '@nestjs/common';
import { BackupsService } from './backups.service.js';
import type { BackupRunner } from './backup-runner.js';
import type { BackupsRepository } from './backups.repository.js';
import type { SecretsService } from './../secrets/secrets.service.js';
import type { StorageRegistry } from './storage/storage.registry.js';
import { BACKUP_RUNNING } from './types/backup.types.js';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe('BackupsService', () => {
  function make(runner: Partial<BackupRunner>) {
    const repo = {
      getSettings: jest.fn().mockResolvedValue({
        keepLast: 14,
        scheduleEnabled: false,
        scheduleTime: '03:00',
      }),
      markStaleRunsFailed: jest.fn().mockResolvedValue({ count: 0 }),
      listProviders: jest
        .fn()
        .mockResolvedValue([{ code: 'LOCAL', label: 'Server disk' }]),
    } as unknown as BackupsRepository;
    const registry = {
      has: () => true,
      get: () => ({ capabilities: { delete: true, maxPartBytes: null } }),
    } as unknown as StorageRegistry;
    const secrets = { set: jest.fn() } as unknown as SecretsService;
    return new BackupsService(repo, runner as BackupRunner, registry, secrets);
  }

  it('refuses a second backup while one runs (BACKUP_RUNNING)', async () => {
    const gate = deferred();
    const svc = make({
      run: jest.fn(() => gate.promise),
      passphrase: jest.fn(),
    });

    const first = svc.startBackup('u1');
    expect(svc.isRunning()).toBe(true);
    await expect(svc.startBackup('u2')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(svc.startBackup('u2')).rejects.toMatchObject({
      response: { code: BACKUP_RUNNING },
    });

    gate.resolve();
    await first;
    expect(svc.isRunning()).toBe(false);
  });

  it('getSettings reports whether the passphrase is set, never its value', async () => {
    const svc = make({
      passphrase: jest.fn().mockResolvedValue('the-secret'),
      passphraseStatus: jest.fn().mockResolvedValue('set'),
    });
    const view = await svc.getSettings();
    expect(view.passphraseSet).toBe(true);
    expect(view.passphraseStatus).toBe('set');
    expect(JSON.stringify(view)).not.toContain('the-secret');
    expect(Object.keys(view)).not.toContain('passphrase');
  });

  it('releases the lock even when a run throws', async () => {
    const svc = make({
      run: jest.fn().mockRejectedValue(new Error('boom')),
      passphrase: jest.fn(),
    });
    await expect(svc.startBackup('u1')).rejects.toThrow('boom');
    expect(svc.isRunning()).toBe(false);
  });
});
