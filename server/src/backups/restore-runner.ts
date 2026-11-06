import { Injectable, Logger } from '@nestjs/common';
import { MaintenanceService } from '../common/runtime/maintenance.service.js';
import { RecoveryService } from '../common/runtime/recovery.service.js';
import { SessionGateService } from '../common/runtime/session-gate.service.js';
import { BackupsReconciler } from './backups-reconcile.service.js';
import { runMigrateDeploy, runPgRestore } from './lib/pg-tools.js';
import type { UploadSwap } from './lib/uploads-swap.js';

export interface RestorePlan {
  databaseUrl: string;
  /** The decrypted dump to restore. */
  databaseDump: string;
  /** The uploads swap, already prepared (extracted) before the DB is touched. */
  swap: UploadSwap;
  /** The decrypted safety-backup dump, used to roll back the database. */
  safetyDump: string;
  safetyRunId?: string;
}

/**
 * The destructive, all-or-nothing section of a restore (A2). Everything that can
 * fail is done before the database is touched (decrypt, verify, extract uploads
 * — by the caller). After `pg_restore`, if any later step fails the database and
 * uploads are rolled back to the safety backup. Only if the rollback itself
 * fails does the system stay in maintenance for manual recovery.
 */
@Injectable()
export class RestoreRunner {
  private readonly logger = new Logger(RestoreRunner.name);

  constructor(
    private readonly maintenance: MaintenanceService,
    private readonly sessions: SessionGateService,
    private readonly recovery: RecoveryService,
    private readonly reconciler: BackupsReconciler,
  ) {}

  async perform(plan: RestorePlan): Promise<void> {
    this.recovery.markRestoreInProgress({ safetyRunId: plan.safetyRunId });
    this.maintenance.begin('restore');
    let pgRestored = false;
    try {
      await runPgRestore(plan.databaseUrl, plan.databaseDump, {
        singleTransaction: true,
      });
      pgRestored = true;
      await runMigrateDeploy(plan.databaseUrl);
      await plan.swap.commit();
      await this.sessions.endAllSessions();
      await this.reconciler.reconcile();
      await plan.swap.finalize();
      this.recovery.clearRestoreInProgress();
      this.maintenance.end();
    } catch (err) {
      await this.handleFailure(
        plan,
        pgRestored,
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /** Always throws: either the rolled-back failure, or (worse) the same failure
   * with the system left in maintenance for manual recovery. */
  private async handleFailure(
    plan: RestorePlan,
    pgRestored: boolean,
    err: Error,
  ): Promise<never> {
    if (!pgRestored) {
      // pg_restore rolled itself back (--single-transaction): DB untouched.
      await plan.swap.rollback().catch(() => undefined);
      this.recovery.clearRestoreInProgress();
      this.maintenance.end();
      throw err;
    }
    // Roll the database and uploads back to the safety backup. The success
    // `throw err` is OUTSIDE this try so it is not mistaken for a rollback error.
    try {
      await plan.swap.rollback();
      await runPgRestore(plan.databaseUrl, plan.safetyDump, {
        singleTransaction: true,
      });
      await this.reconciler.reconcile().catch(() => undefined);
    } catch (rollbackErr) {
      this.logger.error(`Restore rollback failed: ${String(rollbackErr)}`);
      this.recovery.markManualRecovery(
        `restore failed (${err.message}) and rollback failed ` +
          `(${rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr)})`,
      );
      throw err; // stays in maintenance
    }
    this.recovery.clearRestoreInProgress();
    this.maintenance.end();
    this.logger.warn('Restore failed but was rolled back to the safety backup');
    throw err;
  }
}
