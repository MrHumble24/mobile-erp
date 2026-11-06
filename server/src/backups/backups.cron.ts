import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MaintenanceService } from '../common/runtime/maintenance.service.js';
import { BackupsRepository } from './backups.repository.js';
import { BackupsService } from './backups.service.js';
import { isScheduleDue, todayDateOnly } from './lib/schedule.js';

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

      // Mark first so a long or failed run never re-fires the same day.
      await this.repo.markScheduleRan(todayDateOnly(now));
      await this.backups.startBackup(null);
    } catch (err) {
      this.logger.warn(`Scheduled backup failed: ${String(err)}`);
    }
  }
}
