import {
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createWriteStream, promises as fsp } from 'node:fs';
import { join } from 'node:path';
import type { Request } from 'express';
import { readMbkMeta } from './lib/backup-crypto.js';
import { BACKUP_UPLOAD_NOT_FOUND } from './types/backup.types.js';

const UPLOAD_ID = /^[0-9a-f-]{36}$/;

function stagingDir(): string {
  return join(process.env.DATA_DIR?.trim() || './data', 'staging', 'uploads');
}

function maxBytes(): number {
  return Number(process.env.BACKUP_MAX_UPLOAD_BYTES) || 2 * 1024 * 1024 * 1024;
}

/** How long a staged-but-unused upload is kept before the sweep removes it. */
const TTL_MS = 60 * 60 * 1000;

export interface StagedUpload {
  uploadId: string;
  createdAt: string;
  sizeBytes: number;
  migrationName: string | null;
}

/**
 * Two-step restore upload (A7): a raw `.mbk` is streamed to owner-only staging
 * under DATA_DIR, verified as a real backup (its authenticated header reads),
 * and kept under a random id until the matching restore call uses it. Nothing
 * is buffered in memory; stale uploads are swept after a short TTL.
 */
@Injectable()
export class UploadStagingService {
  private readonly logger = new Logger(UploadStagingService.name);

  async stage(req: Request): Promise<StagedUpload> {
    await this.sweep();
    const dir = stagingDir();
    await fsp.mkdir(dir, { recursive: true, mode: 0o700 });
    const uploadId = randomUUID();
    const path = join(dir, `${uploadId}.mbk`);
    try {
      await this.streamToFile(req, path);
      // Verify it is a real backup (header parses + authenticates on open).
      const meta = await readMbkMeta(path);
      const { size } = await fsp.stat(path);
      return {
        uploadId,
        createdAt: meta.createdAt,
        sizeBytes: size,
        migrationName: meta.migrationName,
      };
    } catch (err) {
      await fsp.rm(path, { force: true });
      throw err;
    }
  }

  /** Absolute path of a staged upload; throws if the id is unknown. */
  pathOf(uploadId: string): string {
    if (!UPLOAD_ID.test(uploadId)) {
      throw new NotFoundException({
        code: BACKUP_UPLOAD_NOT_FOUND,
        message: 'No such upload',
      });
    }
    return join(stagingDir(), `${uploadId}.mbk`);
  }

  async remove(uploadId: string): Promise<void> {
    if (!UPLOAD_ID.test(uploadId)) return;
    await fsp.rm(join(stagingDir(), `${uploadId}.mbk`), { force: true });
  }

  private async sweep(): Promise<void> {
    const dir = stagingDir();
    let names: string[];
    try {
      names = await fsp.readdir(dir);
    } catch {
      return;
    }
    const cutoff = Date.now() - TTL_MS;
    for (const name of names) {
      const full = join(dir, name);
      try {
        const { mtimeMs } = await fsp.stat(full);
        if (mtimeMs < cutoff) await fsp.rm(full, { force: true });
      } catch {
        // ignore a file that vanished mid-sweep
      }
    }
  }

  private async streamToFile(req: Request, path: string): Promise<void> {
    const out = createWriteStream(path);
    let bytes = 0;
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes()) {
          req.destroy();
          out.destroy();
          reject(
            new PayloadTooLargeException(
              'Backup file is larger than the allowed size',
            ),
          );
          return;
        }
        if (!out.write(chunk)) req.pause();
      });
      out.on('drain', () => req.resume());
      req.on('end', () => out.end(resolve));
      req.on('error', reject);
      out.on('error', reject);
    });
    if (bytes === 0) {
      this.logger.warn('Empty restore upload rejected');
      throw new PayloadTooLargeException('Empty upload');
    }
  }
}
