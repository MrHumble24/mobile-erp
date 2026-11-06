import type { Readable } from 'node:stream';

/** The produced backup on local disk, handed to an adapter to send away. */
export interface BackupFile {
  path: string;
  name: string;
  sizeBytes: number;
}

/** Provider-specific placement config + secret (resolved by the service). */
export interface Destination {
  config: unknown;
  secret: unknown;
  /** Persist a rotated OAuth refresh token (Microsoft rotates on every refresh,
   * so the adapter stores the new one in place of the old). */
  onRefreshToken?: (token: string) => Promise<void>;
}

/** A provider's own handle for a stored backup (filename, message id, file id). */
export interface RemoteRef {
  ref: string;
}

export interface StorageCapabilities {
  list: boolean;
  download: boolean;
  delete: boolean;
  /** Largest single part the provider accepts; null = no limit (chunk below it). */
  maxPartBytes: number | null;
}

/**
 * A place a backup can be sent. Adding a provider is one new file that
 * implements this, one line in the module, and one row in the providers lookup.
 * The service never switches on `code`.
 */
export interface BackupStorage {
  readonly code: string;
  readonly capabilities: StorageCapabilities;
  /** Prove the place is reachable with this config + secret. */
  validate(config: unknown, secret: unknown): Promise<void>;
  upload(file: BackupFile, dest: Destination): Promise<RemoteRef>;
  download(ref: RemoteRef, dest: Destination): Promise<Readable>;
  remove(ref: RemoteRef, dest: Destination): Promise<void>;
}
