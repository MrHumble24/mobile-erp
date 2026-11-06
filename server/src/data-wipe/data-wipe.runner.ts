import { Injectable, Logger } from '@nestjs/common';
import { MaintenanceService } from '../common/runtime/maintenance.service.js';
import { RecoveryService } from '../common/runtime/recovery.service.js';
import { SessionGateService } from '../common/runtime/session-gate.service.js';
import { DataWipeRepository } from './data-wipe.repository.js';
import type { WipeOptions } from './lib/wipe-tables.js';

export interface WipePlan extends WipeOptions {
  safetyRunId: string | null;
}

/**
 * The destructive section of a wipe. The erase is one transaction (all-or-
 * nothing: a failure rolls it back, nothing erased), so there is no rollback to
 * a safety backup here — unlike restore. It reuses the restore recovery marker
 * for the maintenance switch: a crash mid-wipe leaves the marker, so the server
 * comes back up locked for a manual check (the data itself is intact, Postgres
 * rolled the transaction back). `finally` guarantees maintenance never stays on
 * within a running process.
 */
@Injectable()
export class DataWipeRunner {
  private readonly logger = new Logger(DataWipeRunner.name);

  constructor(
    private readonly maintenance: MaintenanceService,
    private readonly sessions: SessionGateService,
    private readonly recovery: RecoveryService,
    private readonly repo: DataWipeRepository,
  ) {}

  /** Erase, then end every session. Returns rows deleted per table. */
  async perform(plan: WipePlan): Promise<Record<string, number>> {
    this.recovery.markRestoreInProgress({
      safetyRunId: plan.safetyRunId ?? undefined,
    });
    this.maintenance.begin('data-wipe');
    try {
      const counts = await this.repo.erase({
        contacts: plan.contacts,
        catalog: plan.catalog,
      });
      // The data is gone; end every session so each till restarts clean. A
      // failure here cannot un-erase, so it is logged, never thrown — otherwise
      // the committed erase would be reported as a failure.
      try {
        await this.sessions.endAllSessions();
      } catch (err) {
        this.logger.error(`endAllSessions after wipe failed: ${String(err)}`);
      }
      return counts;
    } finally {
      this.recovery.clearRestoreInProgress();
      this.maintenance.end();
    }
  }
}
