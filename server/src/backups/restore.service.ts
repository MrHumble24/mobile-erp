import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createWriteStream, promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { AuthService } from '../auth/auth.service.js';
import { MaintenanceService } from '../common/runtime/maintenance.service.js';
import { SessionGateService } from '../common/runtime/session-gate.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BackupRunner } from './backup-runner.js';
import { BackupsRepository } from './backups.repository.js';
import { BackupsService } from './backups.service.js';
import { uploadsDir } from './lib/backup-config.js';
import { knownMigrations } from './lib/backup-manifest.js';
import { openBackupFile } from './lib/mbk-format.js';
import { runMigrateDeploy, runPgRestore } from './lib/pg-tools.js';
import { swapUploadsFromTar } from './lib/uploads-swap.js';
import {
  BACKUP_FROM_NEWER_VERSION,
  BACKUP_NO_PASSPHRASE,
  RESTORE_CONFIRM_FAILED,
  RESTORE_RUNNING,
} from './types/backup.types.js';

export interface RestoreRequest {
  performedById: string;
  email: string;
  shopName: string;
  password: string;
  /** A backup in the list, or an uploaded file already on disk. */
  source: { runId: string } | { uploadPath: string; label: string };
}

/** Orchestrates an all-or-nothing restore. See ADR 0051 for the step order. */
@Injectable()
export class RestoreService {
  private readonly logger = new Logger(RestoreService.name);
  private restoring = false;

  constructor(
    private readonly repo: BackupsRepository,
    private readonly backups: BackupsService,
    private readonly runner: BackupRunner,
    private readonly stores: StoresService,
    private readonly auth: AuthService,
    private readonly maintenance: MaintenanceService,
    private readonly sessions: SessionGateService,
  ) {}

  isRestoring(): boolean {
    return this.restoring;
  }

  async restore(req: RestoreRequest): Promise<void> {
    await this.confirm(req.shopName, req.email, req.password);
    if (this.restoring || this.maintenance.isActive()) {
      throw new ConflictException({
        code: RESTORE_RUNNING,
        message: 'A restore is already running',
      });
    }
    this.restoring = true;
    const work = await fsp.mkdtemp(join(tmpdir(), 'mbk-restore-'));
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
      throw new BadRequestException({
        code: BACKUP_NO_PASSPHRASE,
        message: 'Set the backup passphrase first',
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
    const record = await this.repo.createRestoreRun(base);

    let safetyRunId: string | undefined;
    let failure: Error | undefined;
    try {
      const opened = await openBackupFile(path, pass, work);
      await this.assertKnownVersion(opened.manifest.migrationName);
      // Safety backup first; stop if it fails (before any destructive step).
      await this.backups.startBackup(req.performedById);
      safetyRunId = (await this.repo.listRuns(1))[0]?.id;
      await this.applyBackup(databaseUrl, opened);
    } catch (err) {
      failure = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Restore failed: ${failure.message}`);
    }
    await this.recordOutcome(record.id, base, safetyRunId, failure);
    return failure;
  }

  /** The destructive, all-or-nothing steps, bracketed by maintenance. */
  private async applyBackup(
    databaseUrl: string,
    opened: { databaseDump: string; uploadsTar: string },
  ): Promise<void> {
    this.maintenance.begin('restore');
    try {
      await runPgRestore(databaseUrl, opened.databaseDump, {
        singleTransaction: true,
      });
      await runMigrateDeploy(databaseUrl);
      await swapUploadsFromTar(opened.uploadsTar, uploadsDir());
      this.sessions.endAllSessions();
    } finally {
      this.maintenance.end();
    }
  }

  /**
   * Best-effort audit. A successful restore wiped the RUNNING row written above,
   * so this upsert re-inserts it; a failure here must not fail an already-done
   * restore (the data is already in place).
   */
  private async recordOutcome(
    id: string,
    base: {
      performedById: string;
      sourceRunId: string | null;
      sourceLabel: string;
    },
    safetyRunId: string | undefined,
    failure: Error | undefined,
  ): Promise<void> {
    try {
      await this.repo.upsertRestoreOutcome(
        id,
        base,
        failure ? 'FAILED' : 'SUCCESS',
        { safetyRunId, error: failure?.message },
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
    await pipeline(stream, createWriteStream(path));
    return { path, label: name, sourceRunId: source.runId };
  }
}
