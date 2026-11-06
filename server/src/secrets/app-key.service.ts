import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KEY_BYTES = 32;

/** The data folder that holds server-only state outside the database. */
export function dataDir(): string {
  return process.env.DATA_DIR?.trim() || './data';
}

/**
 * Owns the app master key that seals every secret. The key is made once, on
 * first use, and written owner-only to `DATA_DIR/master.key` — never to the
 * database, so a leaked DB dump cannot be opened without this file. Env
 * `APP_MASTER_KEY` (base64 or hex, 32 bytes) overrides the file (for Railway,
 * where the filesystem is ephemeral). Lose the key and every secret is dead.
 */
@Injectable()
export class AppKeyService {
  private readonly logger = new Logger(AppKeyService.name);
  private cached?: Buffer;

  getKey(): Buffer {
    if (this.cached) return this.cached;
    this.cached = this.fromEnv() ?? this.fromFile();
    return this.cached;
  }

  private fromEnv(): Buffer | undefined {
    const raw = process.env.APP_MASTER_KEY?.trim();
    if (!raw) return undefined;
    const buf = /^[0-9a-fA-F]{64}$/.test(raw)
      ? Buffer.from(raw, 'hex')
      : Buffer.from(raw, 'base64');
    if (buf.length !== KEY_BYTES) {
      throw new Error('APP_MASTER_KEY must decode to exactly 32 bytes');
    }
    return buf;
  }

  private fromFile(): Buffer {
    const dir = dataDir();
    const file = join(dir, 'master.key');
    if (existsSync(file)) {
      const buf = readFileSync(file);
      if (buf.length !== KEY_BYTES) {
        throw new Error(`${file} is corrupt (expected 32 bytes)`);
      }
      return buf;
    }
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const key = randomBytes(KEY_BYTES);
    writeFileSync(file, key, { mode: 0o600 });
    this.logger.warn(`Generated a new app master key at ${file}`);
    return key;
  }
}
