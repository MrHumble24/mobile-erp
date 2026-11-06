import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import { BackupsRepository } from './backups.repository.js';
import { readMbkMeta } from './lib/backup-crypto.js';
import { backupsDir } from './storage/local.storage.js';

interface FileMeta {
  runId: string;
  createdAt: string;
  sizeBytes: bigint;
}

/**
 * Keeps the backup_runs table honest against what LOCAL storage actually holds
 * (T2). Runs at boot and after every restore — a restore replaces the table
 * with the backup's own rows (its source run frozen as RUNNING, the safety
 * backup absent), which would otherwise show a wrong list.
 *
 *   - a file with no row            → a SUCCESS row (+ LOCAL target)
 *   - a RUNNING row whose file is ok → SUCCESS
 *   - a row whose LOCAL file is gone → the target marked FAILED
 *   - any still-RUNNING row with no file → FAILED (crash cleanup)
 */
@Injectable()
export class BackupsReconciler implements OnModuleInit {
  private readonly logger = new Logger(BackupsReconciler.name);

  constructor(private readonly repo: BackupsRepository) {}

  async onModuleInit(): Promise<void> {
    await this.reconcile();
  }

  async reconcile(): Promise<void> {
    const files = await this.readLocalFiles();
    const runs = await this.repo.listRuns(1000);
    const runById = new Map(runs.map((r) => [r.id, r]));
    const runByFile = new Map(
      runs.filter((r) => r.fileName).map((r) => [r.fileName as string, r]),
    );

    for (const [name, meta] of files) {
      const run = runById.get(meta.runId) ?? runByFile.get(name);
      if (!run) {
        await this.repo
          .insertReconciledRun({
            id: meta.runId,
            createdAt: new Date(meta.createdAt),
            fileName: name,
            sizeBytes: meta.sizeBytes,
          })
          .catch((e) =>
            this.logger.warn(`reconcile insert ${name}: ${String(e)}`),
          );
      } else if (run.statusCode === 'RUNNING') {
        await this.repo
          .reconcileToSuccess(run.id, {
            fileName: name,
            sizeBytes: meta.sizeBytes,
          })
          .catch((e) =>
            this.logger.warn(`reconcile success ${name}: ${String(e)}`),
          );
      }
    }

    const present = new Set(files.keys());
    for (const run of runs) {
      const local = run.targets.find(
        (t) =>
          t.providerCode === 'LOCAL' &&
          t.statusCode === 'UPLOADED' &&
          t.remoteRef,
      );
      if (local?.remoteRef && !present.has(local.remoteRef)) {
        await this.repo.markLocalTargetMissing(local.id).catch(() => undefined);
      }
    }

    // Any run still RUNNING without a backing file was interrupted.
    await this.repo.markStaleRunsFailed();
  }

  private async readLocalFiles(): Promise<Map<string, FileMeta>> {
    const dir = backupsDir();
    const out = new Map<string, FileMeta>();
    let names: string[];
    try {
      names = (await fsp.readdir(dir)).filter((f) => f.endsWith('.mbk'));
    } catch {
      return out; // no backups dir yet
    }
    for (const name of names) {
      try {
        const full = join(dir, name);
        const meta = await readMbkMeta(full);
        const { size } = await fsp.stat(full);
        out.set(name, {
          runId: meta.runId,
          createdAt: meta.createdAt,
          sizeBytes: BigInt(size),
        });
      } catch (e) {
        this.logger.warn(`Unreadable backup file ${name}: ${String(e)}`);
      }
    }
    return out;
  }
}
