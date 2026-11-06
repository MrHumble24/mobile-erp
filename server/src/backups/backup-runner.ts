import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SecretsService } from '../secrets/secrets.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import { sha256File } from './lib/backup-manifest.js';
import { createBackupFile } from './lib/mbk-format.js';
import { assertPgTools } from './lib/pg-tools.js';
import { BackupsRepository } from './backups.repository.js';
import { backupDestination, uploadsDir } from './lib/backup-config.js';
import { StorageRegistry } from './storage/storage.registry.js';
import {
  BACKUP_NO_PASSPHRASE,
  BACKUP_PASSPHRASE_SECRET,
  TARGET_STATUS,
} from './types/backup.types.js';

/** Runs one backup end-to-end: dump, pack, encrypt, send to every place,
 * apply retention. The same code runs for the button and the schedule. */
@Injectable()
export class BackupRunner {
  private readonly logger = new Logger(BackupRunner.name);

  constructor(
    private readonly repo: BackupsRepository,
    private readonly registry: StorageRegistry,
    private readonly secrets: SecretsService,
    private readonly telegram: TelegramService,
  ) {}

  /** Resolve the passphrase: the secret first, then the env fallback. */
  async passphrase(): Promise<string | null> {
    const fromSecret = await this.secrets.read(BACKUP_PASSPHRASE_SECRET);
    return fromSecret ?? process.env.BACKUP_PASSPHRASE?.trim() ?? null;
  }

  async run(triggeredById: string | null, keepLast: number): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const pass = await this.passphrase();
    if (!pass) {
      throw new BadRequestException({
        code: BACKUP_NO_PASSPHRASE,
        message: 'Set the backup passphrase before making a backup',
      });
    }
    await assertPgTools(await this.repo.serverMajor());

    const migrationName = await this.repo.lastAppliedMigration();
    const run = await this.repo.createRun(triggeredById, migrationName);
    const work = await fsp.mkdtemp(join(tmpdir(), 'mbk-run-'));
    try {
      await this.produce(
        run.id,
        pass,
        databaseUrl,
        migrationName,
        work,
        keepLast,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.repo.failRun(run.id, message);
      if (triggeredById === null) {
        await this.telegram.send(
          `❌ Scheduled backup failed: ${message}. No file was sent. Check Settings → Backups.`,
        );
      }
      throw err;
    } finally {
      await fsp.rm(work, { recursive: true, force: true });
    }
  }

  /** The happy path: build the file, send it everywhere, record, retain. */
  private async produce(
    runId: string,
    passphrase: string,
    databaseUrl: string,
    migrationName: string | null,
    work: string,
    keepLast: number,
  ): Promise<void> {
    const name = fileName(runId);
    const tempFile = join(work, name);
    await createBackupFile({
      databaseUrl,
      uploadsDir: uploadsDir(),
      outFile: tempFile,
      passphrase,
      migrationName,
      workDir: work,
    });
    const { size } = await fsp.stat(tempFile);
    const checksum = await sha256File(tempFile);

    const uploaded = await this.sendEverywhere(runId, {
      path: tempFile,
      name,
      sizeBytes: size,
    });
    if (uploaded === 0) throw new Error('No storage place accepted the backup');

    await this.repo.finishRun(runId, {
      fileName: name,
      sizeBytes: BigInt(size),
      checksum,
    });
    for (const code of this.registry.codes()) {
      await this.applyRetention(code, keepLast);
    }
  }

  /** Attempt every registered place; one row per place. Returns how many took it. */
  private async sendEverywhere(
    runId: string,
    file: { path: string; name: string; sizeBytes: number },
  ): Promise<number> {
    let ok = 0;
    for (const code of this.registry.codes()) {
      const target = await this.repo.createTarget(
        runId,
        code,
        TARGET_STATUS.PENDING,
      );
      try {
        const adapter = this.registry.get(code);
        const ref = await adapter.upload(file, backupDestination(code));
        await this.repo.updateTarget(target.id, {
          statusCode: TARGET_STATUS.UPLOADED,
          remoteRef: ref.ref,
        });
        ok += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Upload to ${code} failed: ${message}`);
        await this.repo.updateTarget(target.id, {
          statusCode: TARGET_STATUS.FAILED,
          error: message,
        });
      }
    }
    return ok;
  }

  /** Keep the newest `keepLast` per place; delete older where the place allows. */
  private async applyRetention(code: string, keepLast: number): Promise<void> {
    const adapter = this.registry.get(code);
    if (!adapter.capabilities.delete) return;
    const targets = await this.repo.uploadedTargets(code);
    for (const target of targets.slice(keepLast)) {
      try {
        if (target.remoteRef) {
          await adapter.remove(
            { ref: target.remoteRef },
            backupDestination(code),
          );
        }
        await this.repo.deleteTarget(target.id);
      } catch (err) {
        this.logger.warn(`Retention delete on ${code} failed: ${String(err)}`);
      }
    }
    await this.repo.deleteOrphanRuns();
  }
}

/** backup-<yyyy-mm-dd>-<hhmm>-<short id>.mbk */
function fileName(runId: string): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  const time = `${p(now.getHours())}${p(now.getMinutes())}`;
  return `backup-${date}-${time}-${runId.slice(0, 8)}.mbk`;
}
