import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MaintenanceService } from '../common/runtime/maintenance.service.js';
import { BackupsRepository } from './backups.repository.js';
import { BackupsService } from './backups.service.js';
import { isScheduleDue, todayDateOnly } from './lib/schedule.js';
import { BACKUP_RUNNING } from './types/backup.types.js';

/** Fires the daily backup once, at the chosen local time. Company-wide: no
 * store context (ADR 0045). Does nothing while a restore holds maintenance. */
@Injectable()
export class BackupsCron {
  private readonly logger = new Logger(BackupsCron.name);

  constructor(
    private readonly repo: BackupsRepository,
    private readonly backups: BackupsService,
    private readonly maintenance: MaintenanceService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.maintenance.isActive()) return;
    const now = new Date();
    try {
      const settings = await this.repo.getSettings();
      if (!settings.scheduleEnabled) return;
      if (!isScheduleDue(now, settings.scheduleTime, settings.lastRunOn))
        return;

      // Mark only after the run actually attempted, so a day held off by the
      // one-at-a-time lock is retried next minute instead of silently skipped
      // (A11). A genuine failure alerts the shop and is left for the next day.
      await this.backups.startBackup(null);
      await this.repo.markScheduleRan(todayDateOnly(now));
    } catch (err) {
      if (isBackupRunning(err)) {
        this.logger.debug(
          'Scheduled backup deferred: a backup is already running',
        );
        return;
      }
      await this.repo
        .markScheduleRan(todayDateOnly(now))
        .catch(() => undefined);
      this.logger.warn(`Scheduled backup failed: ${String(err)}`);
    }
  }
}

function isBackupRunning(err: unknown): boolean {
  if (!(err instanceof ConflictException)) return false;
  const res = err.getResponse();
  return (
    typeof res === 'object' &&
    (res as { code?: string }).code === BACKUP_RUNNING
  );
}
