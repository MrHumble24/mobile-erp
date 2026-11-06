import { promises as fsp } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Destination } from '../storage/backup-storage.js';

/** The data folder for server-only state (same as secrets/app-key). */
function dataDir(): string {
  return resolve(process.env.DATA_DIR?.trim() || './data');
}

/** The product-pictures folder (same default as main.ts), packed into backups. */
export function uploadsDir(): string {
  return resolve(process.env.UPLOADS_DIR?.trim() || './uploads');
}

/**
 * Owner-only staging area under DATA_DIR. Decrypted dumps and uploaded files go
 * here, never in the world-readable `os.tmpdir()` — a plaintext database must
 * not sit where other local users can read it (A8).
 */
export async function makeStaging(tag: string): Promise<string> {
  const base = join(dataDir(), 'staging');
  await fsp.mkdir(base, { recursive: true, mode: 0o700 });
  return fsp.mkdtemp(join(base, `${tag}-`));
}

/**
 * The largest payload (dump + uploads, before encryption) a backup may hold.
 * One AES-GCM message is safe well under its ~64 GiB ceiling; we refuse far
 * below it rather than build a file that cannot be trusted. Chunked framing is
 * a later feature, not this one.
 */
export function maxPayloadBytes(): number {
  return (
    Number(process.env.BACKUP_MAX_PAYLOAD_BYTES) || 32 * 1024 * 1024 * 1024
  );
}

/** Thrown when a backup's payload would exceed {@link maxPayloadBytes}. */
export class BackupTooLargeError extends Error {
  readonly code = 'BACKUP_TOO_LARGE';
  constructor(bytes: number, limit: number) {
    super(
      `Backup payload ${bytes} bytes exceeds the ${limit}-byte limit; ` +
        'reduce data/uploads or raise BACKUP_MAX_PAYLOAD_BYTES',
    );
  }
}

/**
 * Placement config + secret for a provider. LOCAL needs nothing. Remote
 * providers (Telegram, Drive, OneDrive) resolve their own config + secret when
 * they are added — each extends this without a switch on the LOCAL path.
 */
export function backupDestination(code: string): Destination {
  return { config: { providerCode: code }, secret: undefined };
}
