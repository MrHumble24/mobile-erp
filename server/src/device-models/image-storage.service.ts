import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import type { ImageExt } from './lib/image-file.js';

/**
 * Writes and deletes product pictures on disk under UPLOADS_DIR (default
 * `./uploads`, created on start, git-ignored). File names are server-generated
 * (a random UUID + the real extension) so nothing from the client ever reaches
 * the path — no traversal. On Railway UPLOADS_DIR must be a mounted volume or
 * pictures vanish on every deploy (see server/README.md).
 */
@Injectable()
export class ImageStorageService {
  private readonly dir = process.env.UPLOADS_DIR?.trim() || './uploads';

  constructor() {
    mkdirSync(this.dir, { recursive: true });
  }

  /** Writes the bytes under a fresh random name and returns that name. */
  async save(buffer: Buffer, ext: ImageExt): Promise<string> {
    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(join(this.dir, fileName), buffer);
    return fileName;
  }

  /** Deletes a stored file; a missing file is not an error (idempotent). */
  async remove(fileName: string | null): Promise<void> {
    if (!fileName) return;
    await unlink(join(this.dir, fileName)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      },
    );
  }
}
