import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Readable } from 'node:stream';
import { SecretsService } from '../secrets/secrets.service.js';
import { BackupRunner } from './backup-runner.js';
import { BackupsRepository } from './backups.repository.js';
import { BackupTooLargeError } from './lib/backup-config.js';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto.js';
import { ProviderDestination } from './providers/provider-destination.js';
import { StorageRegistry } from './storage/storage.registry.js';
import {
  BACKUP_FILE_MISSING,
  BACKUP_NOT_FOUND,
  BACKUP_PASSPHRASE_SECRET,
  BACKUP_RUNNING,
  BACKUP_TOO_LARGE,
  BackupRunView,
  BackupSettingsView,
  ProviderView,
} from './types/backup.types.js';

type RunWithTargets = Awaited<ReturnType<BackupsRepository['getRun']>>;

/** The controller's single door to backups. Owns the one-at-a-time lock. */
@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private running = false;

  constructor(
    private readonly repo: BackupsRepository,
    private readonly runner: BackupRunner,
    private readonly registry: StorageRegistry,
    private readonly secrets: SecretsService,
    private readonly destination: ProviderDestination,
  ) {}

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
    } catch (err) {
      if (err instanceof BackupTooLargeError) {
        throw new BadRequestException({
          code: BACKUP_TOO_LARGE,
          message: err.message,
        });
      }
      throw err;
    } finally {
      this.running = false;
    }
  }

  async listRuns(): Promise<BackupRunView[]> {
    const runs = await this.repo.listRuns();
    return runs.map((r) => this.toRunView(r));
  }

  /** A provider can serve a downloadable copy right now. */
  private canDownload(providerCode: string): boolean {
    return (
      this.registry.has(providerCode) &&
      this.registry.get(providerCode).capabilities.download
    );
  }

  private toRunView(run: NonNullable<RunWithTargets>): BackupRunView {
    const downloadable = run.targets.some(
      (t) => t.statusCode === 'UPLOADED' && this.canDownload(t.providerCode),
    );
    const partlyFailed =
      run.statusCode === 'SUCCESS' &&
      run.targets.some((t) => t.statusCode === 'FAILED');
    return { ...toRunView(run), partlyFailed, downloadable };
  }

  async getSettings(): Promise<BackupSettingsView> {
    const s = await this.repo.getSettings();
    const passphraseStatus = await this.runner.passphraseStatus();
    return {
      scheduleEnabled: s.scheduleEnabled,
      scheduleTime: s.scheduleTime,
      keepLast: s.keepLast,
      passphraseSet: passphraseStatus === 'set',
      passphraseStatus,
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

  /** Open a backup's encrypted file for download. LOCAL first, then any remote
   * place that can download — so a backup kept only on Drive still restores. */
  async download(
    id: string,
  ): Promise<{ stream: Readable; name: string; size: number }> {
    const run = await this.requireRun(id);
    const usable = run.targets.filter(
      (t) =>
        t.statusCode === 'UPLOADED' &&
        t.remoteRef &&
        this.registry.has(t.providerCode) &&
        this.registry.get(t.providerCode).capabilities.download,
    );
    const target = usable.find((t) => t.providerCode === 'LOCAL') ?? usable[0];
    if (!target?.remoteRef || !run.fileName) {
      throw new NotFoundException({
        code: BACKUP_FILE_MISSING,
        message: 'No downloadable copy of this backup is available',
      });
    }
    const adapter = this.registry.get(target.providerCode);
    const stream = await adapter.download(
      { ref: target.remoteRef },
      await this.destination.resolve(target.providerCode),
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
          await this.destination.resolve(target.providerCode),
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

type BaseRunView = Omit<BackupRunView, 'partlyFailed' | 'downloadable'>;

function toRunView(run: NonNullable<RunWithTargets>): BaseRunView {
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
