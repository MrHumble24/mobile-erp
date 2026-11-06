import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { MaintenanceService } from './maintenance.service.js';

/** Same default as secrets/app-key.service.ts. On Railway DATA_DIR must be a
 * persistent volume (ADR 0051) so these markers survive a redeploy. */
function dataDir(): string {
  return process.env.DATA_DIR?.trim() || './data';
}

/**
 * Persisted restore markers (A5). A restore writes "in progress" before it
 * touches the database; a crash then comes back up here. "Manual recovery
 * required" is set when a restore failed *and* its rollback failed — the system
 * stays in maintenance until an operator fixes it and clears the marker
 * (`pnpm tsx scripts/clear-recovery.ts`). Single-instance only: one process
 * owns these files and the maintenance switch (documented in ADR 0051).
 */
@Injectable()
export class RecoveryService implements OnModuleInit {
  private readonly logger = new Logger(RecoveryService.name);
  private manualRecovery = false;

  constructor(private readonly maintenance: MaintenanceService) {}

  onModuleInit(): void {
    if (existsSync(this.manualFile())) {
      this.enterManual(
        this.readDetail(this.manualFile()) || 'manual recovery required',
      );
      return;
    }
    if (existsSync(this.inProgressFile())) {
      // A crash mid-restore: the database state is unknown, so come up locked.
      this.markManualRecovery(
        'the server restarted while a restore was running',
      );
    }
  }

  restoreInProgress(): boolean {
    return existsSync(this.inProgressFile());
  }

  needsManualRecovery(): boolean {
    return this.manualRecovery;
  }

  markRestoreInProgress(info: { safetyRunId?: string }): void {
    this.write(this.inProgressFile(), {
      ...info,
      at: new Date().toISOString(),
    });
  }

  clearRestoreInProgress(): void {
    rmSync(this.inProgressFile(), { force: true });
  }

  markManualRecovery(detail: string): void {
    this.write(this.manualFile(), { detail, at: new Date().toISOString() });
    this.enterManual(detail);
  }

  clearManualRecovery(): void {
    rmSync(this.manualFile(), { force: true });
    rmSync(this.inProgressFile(), { force: true });
    this.manualRecovery = false;
    this.maintenance.end();
    this.logger.warn('Manual recovery cleared; maintenance ended');
  }

  private enterManual(detail: string): void {
    this.manualRecovery = true;
    this.maintenance.begin(`manual recovery: ${detail}`);
    this.logger.error(
      `MANUAL RECOVERY REQUIRED — the system stays in maintenance. ${detail}. ` +
        'See server/src/backups/README.md, then run scripts/clear-recovery.ts.',
    );
  }

  private inProgressFile(): string {
    return join(dataDir(), 'restore.in-progress');
  }

  private manualFile(): string {
    return join(dataDir(), 'restore.manual-recovery');
  }

  private write(file: string, data: unknown): void {
    mkdirSync(dataDir(), { recursive: true, mode: 0o700 });
    writeFileSync(file, JSON.stringify(data), { mode: 0o600 });
  }

  private readDetail(file: string): string | undefined {
    try {
      return (JSON.parse(readFileSync(file, 'utf8')) as { detail?: string })
        .detail;
    } catch {
      return undefined;
    }
  }
}
