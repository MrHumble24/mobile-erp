import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { Readable } from 'node:stream';
import { SecretsService } from '../secrets/secrets.service.js';
import { BackupRunner } from './backup-runner.js';
import { BackupsRepository } from './backups.repository.js';
import { backupDestination } from './lib/backup-config.js';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto.js';
import { StorageRegistry } from './storage/storage.registry.js';
import {
  BACKUP_FILE_MISSING,
  BACKUP_NOT_FOUND,
  BACKUP_PASSPHRASE_SECRET,
  BACKUP_RUNNING,
  BackupRunView,
  BackupSettingsView,
  ProviderView,
} from './types/backup.types.js';

type RunWithTargets = Awaited<ReturnType<BackupsRepository['getRun']>>;

/** The controller's single door to backups. Owns the one-at-a-time lock. */
@Injectable()
export class BackupsService implements OnModuleInit {
  private readonly logger = new Logger(BackupsService.name);
  private running = false;

  constructor(
    private readonly repo: BackupsRepository,
    private readonly runner: BackupRunner,
    private readonly registry: StorageRegistry,
    private readonly secrets: SecretsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const { count } = await this.repo.markStaleRunsFailed();
    if (count > 0)
      this.logger.warn(`Marked ${count} interrupted backup run(s) failed`);
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Make a backup now. Refuses a second concurrent run with BACKUP_RUNNING. */
  async startBackup(triggeredById: string | null): Promise<void> {
    if (this.running) {
      throw new ConflictException({
        code: BACKUP_RUNNING,
        message: 'A backup is already running',
      });
    }
    this.running = true;
    try {
      const { keepLast } = await this.repo.getSettings();
      await this.runner.run(triggeredById, keepLast);
    } finally {
      this.running = false;
    }
  }

  async listRuns(): Promise<BackupRunView[]> {
    const runs = await this.repo.listRuns();
    return runs.map((r) => toRunView(r));
  }

  async getSettings(): Promise<BackupSettingsView> {
    const s = await this.repo.getSettings();
    return {
      scheduleEnabled: s.scheduleEnabled,
      scheduleTime: s.scheduleTime,
      keepLast: s.keepLast,
      passphraseSet: (await this.runner.passphrase()) !== null,
    };
  }

  async updateSettings(
    dto: UpdateBackupSettingsDto,
  ): Promise<BackupSettingsView> {
    await this.repo.updateSettings(dto);
    return this.getSettings();
  }

  async setPassphrase(value: string): Promise<void> {
    await this.secrets.set(BACKUP_PASSPHRASE_SECRET, value);
  }

  async listProviders(): Promise<ProviderView[]> {
    const providers = await this.repo.listProviders();
    return providers.map((p) => {
      const available = this.registry.has(p.code);
      const caps = available ? this.registry.get(p.code).capabilities : null;
      return {
        code: p.code,
        label: p.label,
        available,
        capabilities: {
          delete: caps?.delete ?? false,
          maxPartBytes: caps?.maxPartBytes ?? null,
        },
      };
    });
  }

  /** Open a backup's encrypted file for download (as-is). */
  async download(
    id: string,
  ): Promise<{ stream: Readable; name: string; size: number }> {
    const run = await this.requireRun(id);
    const target = run.targets.find(
      (t) =>
        t.statusCode === 'UPLOADED' &&
        this.registry.has(t.providerCode) &&
        t.remoteRef,
    );
    if (!target?.remoteRef || !run.fileName) {
      throw new NotFoundException({
        code: BACKUP_FILE_MISSING,
        message: 'No downloadable copy of this backup is on the server',
      });
    }
    const adapter = this.registry.get(target.providerCode);
    const stream = await adapter.download(
      { ref: target.remoteRef },
      backupDestination(target.providerCode),
    );
    return { stream, name: run.fileName, size: Number(run.sizeBytes ?? 0) };
  }

  async deleteRun(id: string): Promise<void> {
    const run = await this.requireRun(id);
    for (const target of run.targets) {
      if (!target.remoteRef || !this.registry.has(target.providerCode))
        continue;
      const adapter = this.registry.get(target.providerCode);
      if (!adapter.capabilities.delete) continue;
      try {
        await adapter.remove(
          { ref: target.remoteRef },
          backupDestination(target.providerCode),
        );
      } catch (err) {
        this.logger.warn(
          `Delete on ${target.providerCode} failed: ${String(err)}`,
        );
      }
    }
    await this.repo.deleteRun(id);
  }

  private async requireRun(id: string): Promise<NonNullable<RunWithTargets>> {
    const run = await this.repo.getRun(id);
    if (!run) {
      throw new NotFoundException({
        code: BACKUP_NOT_FOUND,
        message: 'Backup not found',
      });
    }
    return run;
  }
}

function toRunView(run: NonNullable<RunWithTargets>): BackupRunView {
  return {
    id: run.id,
    triggeredById: run.triggeredById,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    fileName: run.fileName,
    sizeBytes: run.sizeBytes === null ? null : Number(run.sizeBytes),
    checksum: run.checksum,
    migrationName: run.migrationName,
    status: run.statusCode,
    error: run.error,
    targets: run.targets.map((t) => ({
      providerCode: t.providerCode,
      status: t.statusCode,
      remoteRef: t.remoteRef,
      error: t.error,
    })),
  };
}
