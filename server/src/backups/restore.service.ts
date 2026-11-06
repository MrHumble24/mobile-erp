import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createWriteStream, promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { AuthService } from '../auth/auth.service.js';
import { RecoveryService } from '../common/runtime/recovery.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BackupRunner } from './backup-runner.js';
import { BackupsRepository } from './backups.repository.js';
import { BackupsService } from './backups.service.js';
import { RestoreRepository } from './restore.repository.js';
import { makeStaging, uploadsDir } from './lib/backup-config.js';
import { byteCap, maxUploadBytes } from './lib/byte-cap.js';
import { knownMigrations } from './lib/backup-manifest.js';
import { openBackupFile } from './lib/mbk-format.js';
import { UploadSwap } from './lib/uploads-swap.js';
import { RestoreRunner } from './restore-runner.js';
import { backupsDir } from './storage/local.storage.js';
import {
  BACKUP_FROM_NEWER_VERSION,
  BACKUP_NO_PASSPHRASE,
  BACKUP_PASSPHRASE_UNREADABLE,
  RESTORE_CONFIRM_FAILED,
  RESTORE_RUNNING,
  RestoreStatusView,
} from './types/backup.types.js';

export interface RestoreRequest {
  performedById: string;
  email: string;
  shopName: string;
  password: string;
  /** A backup in the list, or an uploaded file already on disk. */
  source: { runId: string } | { uploadPath: string; label: string };
}

type RestoreBase = {
  performedById: string;
  sourceRunId: string | null;
  sourceLabel: string;
};

/** Orchestrates an all-or-nothing restore. See ADR 0051 for the step order. */
@Injectable()
export class RestoreService {
  private readonly logger = new Logger(RestoreService.name);
  private restoring = false;

  constructor(
    private readonly repo: BackupsRepository,
    private readonly restoreRepo: RestoreRepository,
    private readonly backups: BackupsService,
    private readonly runner: BackupRunner,
    private readonly restoreRunner: RestoreRunner,
    private readonly stores: StoresService,
    private readonly auth: AuthService,
    private readonly recovery: RecoveryService,
  ) {}

  isRestoring(): boolean {
    return this.restoring;
  }

  async status(): Promise<RestoreStatusView> {
    const last = await this.restoreRepo.latestRestoreRun();
    return {
      restoring: this.restoring,
      needsManualRecovery: this.recovery.needsManualRecovery(),
      last: last
        ? {
            status: last.statusCode,
            startedAt: last.startedAt,
            finishedAt: last.finishedAt,
            error: last.error,
          }
        : null,
    };
  }

  async restore(req: RestoreRequest): Promise<void> {
    await this.confirm(req.shopName, req.email, req.password);
    if (
      this.restoring ||
      this.recovery.needsManualRecovery() ||
      this.recovery.restoreInProgress()
    ) {
      throw new ConflictException({
        code: RESTORE_RUNNING,
        message: 'A restore is already running or awaiting recovery',
      });
    }
    this.restoring = true;
    const work = await makeStaging('restore');
    try {
      const failure = await this.run(req, work);
      if (failure) throw failure;
    } finally {
      this.restoring = false;
      await fsp.rm(work, { recursive: true, force: true });
    }
  }

  /** Runs the restore and records its outcome; returns the failure (if any). */
  private async run(
    req: RestoreRequest,
    work: string,
  ): Promise<Error | undefined> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');
    const pass = await this.runner.passphrase();
    if (!pass) {
      const unreadable =
        (await this.runner.passphraseStatus()) === 'unreadable';
      throw new BadRequestException({
        code: unreadable ? BACKUP_PASSPHRASE_UNREADABLE : BACKUP_NO_PASSPHRASE,
        message: unreadable
          ? 'The stored backup passphrase cannot be read on this server; type it again'
          : 'Set the backup passphrase first',
      });
    }

    const { path, label, sourceRunId } = await this.resolveSource(
      req.source,
      work,
    );
    const base = {
      performedById: req.performedById,
      sourceRunId,
      sourceLabel: label,
    };
    const record = await this.restoreRepo.createRestoreRun(base);

    const outcome = { safetyRunId: undefined as string | undefined };
    let failure: Error | undefined;
    try {
      await this.execute(req, work, pass, databaseUrl, path, outcome);
    } catch (err) {
      failure = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Restore failed: ${failure.message}`);
    }
    await this.recordOutcome(record.id, base, outcome.safetyRunId, failure);
    return failure;
  }

  /** Prepare everything that can fail, make the safety backup, then perform the
   * destructive steps with rollback (the runner owns maintenance + markers). */
  private async execute(
    req: RestoreRequest,
    work: string,
    pass: string,
    databaseUrl: string,
    path: string,
    outcome: { safetyRunId?: string },
  ): Promise<void> {
    const opened = await openBackupFile(path, pass, work);
    await this.assertKnownVersion(opened.manifest.migrationName);
    const swap = await UploadSwap.prepare(opened.uploadsTar, uploadsDir());

    // Safety backup, then pre-decrypt its dump so a rollback cannot fail on it.
    await this.backups.startBackup(req.performedById);
    const safety = (await this.repo.listRuns(1))[0];
    outcome.safetyRunId = safety?.id;
    if (!safety?.fileName) throw new Error('Safety backup produced no file');
    const safetyOpened = await openBackupFile(
      join(backupsDir(), safety.fileName),
      pass,
      work,
    );

    await this.restoreRunner.perform({
      databaseUrl,
      databaseDump: opened.databaseDump,
      swap,
      safetyDump: safetyOpened.databaseDump,
      safetyRunId: safety.id,
    });
  }

  /** Best-effort audit (a successful restore wipes the RUNNING row; upsert it). */
  private async recordOutcome(
    id: string,
    base: RestoreBase,
    safetyRunId: string | undefined,
    failure: Error | undefined,
  ): Promise<void> {
    try {
      await this.restoreRepo.upsertRestoreOutcome(
        id,
        base,
        failure ? 'FAILED' : 'SUCCESS',
        {
          safetyRunId,
          error: failure?.message,
        },
      );
    } catch (auditErr) {
      this.logger.warn(`Restore audit write failed: ${String(auditErr)}`);
    }
  }

  /** Shop name typed exactly + the caller's own password, both re-checked. */
  private async confirm(
    shopName: string,
    email: string,
    password: string,
  ): Promise<void> {
    const stores = await this.stores.list(false);
    const nameOk = stores.some((s) => s.name === shopName);
    const passOk = await this.auth.verifyPassword(email, password);
    if (!nameOk || !passOk) {
      throw new ForbiddenException({
        code: RESTORE_CONFIRM_FAILED,
        message: 'The shop name or password did not match',
      });
    }
  }

  private async assertKnownVersion(
    migrationName: string | null,
  ): Promise<void> {
    if (!migrationName) return;
    const known = await knownMigrations();
    if (!known.has(migrationName)) {
      throw new UnprocessableEntityException({
        code: BACKUP_FROM_NEWER_VERSION,
        message: `This backup is from a newer version (${migrationName}); upgrade the server first`,
      });
    }
  }

  /** Put the source .mbk on disk (download a listed run, or use the upload). */
  private async resolveSource(
    source: RestoreRequest['source'],
    work: string,
  ): Promise<{ path: string; label: string; sourceRunId: string | null }> {
    if ('uploadPath' in source) {
      return {
        path: source.uploadPath,
        label: source.label,
        sourceRunId: null,
      };
    }
    const { stream, name } = await this.backups.download(source.runId);
    const path = join(work, name);
    // Cap the bytes while staging, so a remote copy cannot fill the disk (item 3).
    await pipeline(stream, byteCap(maxUploadBytes()), createWriteStream(path));
    return { path, label: name, sourceRunId: source.runId };
  }
}
