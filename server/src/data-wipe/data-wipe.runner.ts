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
 * The destructive section of a wipe or factory reset. The erase is one
 * transaction (all-or-nothing: a failure rolls it back, nothing erased).
 * It reuses the restore recovery marker for the maintenance switch: a crash
 * leaves the marker so the server comes back up locked for a manual check.
 * `finally` guarantees maintenance never stays on within a running process.
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

  /** Factory reset, then end every session. Returns rows deleted per table. */
  async performReset(plan: {
    safetyRunId: string | null;
  }): Promise<Record<string, number>> {
    this.recovery.markRestoreInProgress({
      safetyRunId: plan.safetyRunId ?? undefined,
    });
    this.maintenance.begin('data-reset');
    try {
      const counts = await this.repo.reset(plan.safetyRunId);
      try {
        await this.sessions.endAllSessions();
      } catch (err) {
        this.logger.error(`endAllSessions after reset failed: ${String(err)}`);
      }
      return counts;
    } finally {
      this.recovery.clearRestoreInProgress();
      this.maintenance.end();
    }
  }
}
