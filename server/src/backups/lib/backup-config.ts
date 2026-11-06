import { resolve } from 'node:path';
import type { Destination } from '../storage/backup-storage.js';

/** The product-pictures folder (same default as main.ts), packed into backups. */
export function uploadsDir(): string {
  return resolve(process.env.UPLOADS_DIR?.trim() || './uploads');
}

/**
 * Placement config + secret for a provider. LOCAL needs nothing. Remote
 * providers (Telegram, Drive, OneDrive) resolve their own config + secret when
 * they are added — each extends this without a switch on the LOCAL path.
 */
export function backupDestination(code: string): Destination {
  return { config: { providerCode: code }, secret: undefined };
}
