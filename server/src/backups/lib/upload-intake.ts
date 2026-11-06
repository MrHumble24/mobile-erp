import { PayloadTooLargeException } from '@nestjs/common';
import { createWriteStream, promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Request } from 'express';

/** 2 GiB default cap for an uploaded backup (override with env). */
const maxBytes = (): number =>
  Number(process.env.BACKUP_MAX_UPLOAD_BYTES) || 2 * 1024 * 1024 * 1024;

export interface Intake {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Stream a raw request body to a temp file, never buffering it in memory, and
 * refuse anything over the size cap. The caller runs `cleanup()` when done.
 */
export async function streamToTempFile(req: Request): Promise<Intake> {
  const dir = await fsp.mkdtemp(join(tmpdir(), 'mbk-upload-'));
  const path = join(dir, 'uploaded.mbk');
  const out = createWriteStream(path);
  const cleanup = () => fsp.rm(dirname(path), { recursive: true, force: true });
  let bytes = 0;

  try {
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
  } catch (err) {
    await cleanup();
    throw err;
  }
  return { path, cleanup };
}
