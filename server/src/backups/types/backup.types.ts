/** Error codes returned to the client (stable, matched by the website). */
export const BACKUP_RUNNING = 'BACKUP_RUNNING';
export const BACKUP_NO_PASSPHRASE = 'BACKUP_NO_PASSPHRASE';
export const BACKUP_PASSPHRASE_UNREADABLE = 'BACKUP_PASSPHRASE_UNREADABLE';
export const BACKUP_TOO_LARGE = 'BACKUP_TOO_LARGE';
export const BACKUP_NOT_FOUND = 'BACKUP_NOT_FOUND';
export const BACKUP_FILE_MISSING = 'BACKUP_FILE_MISSING';
export const BACKUP_UPLOAD_NOT_FOUND = 'BACKUP_UPLOAD_NOT_FOUND';
export const RESTORE_CONFIRM_FAILED = 'RESTORE_CONFIRM_FAILED';
export const BACKUP_FROM_NEWER_VERSION = 'BACKUP_FROM_NEWER_VERSION';
export const RESTORE_RUNNING = 'RESTORE_RUNNING';
export const MAINTENANCE = 'MAINTENANCE';

export const BACKUP_PASSPHRASE_SECRET = 'backup.passphrase';

// Provider management (PART 3/4)
export const PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND';
export const PROVIDER_NOT_AVAILABLE = 'PROVIDER_NOT_AVAILABLE';
export const PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED';
export const PROVIDER_LOCAL_LOCKED = 'PROVIDER_LOCAL_LOCKED';
export const PROVIDER_NOT_CONNECTED = 'PROVIDER_NOT_CONNECTED';
export const BACKUP_CHAT_IS_STAFF_CHAT = 'BACKUP_CHAT_IS_STAFF_CHAT';
export const OAUTH_STATE_INVALID = 'OAUTH_STATE_INVALID';
export const OAUTH_NOT_SUPPORTED = 'OAUTH_NOT_SUPPORTED';
export const OAUTH_RETURN_URL_INVALID = 'OAUTH_RETURN_URL_INVALID';

export type PassphraseStatus = 'set' | 'missing' | 'unreadable';

export const PROVIDER_STATUS = {
  OK: 'OK',
  NEEDS_RECONNECT: 'NEEDS_RECONNECT',
  ERROR: 'ERROR',
  NEVER_USED: 'NEVER_USED',
} as const;

export const RUN_STATUS = {
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

export const TARGET_STATUS = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  FAILED: 'FAILED',
} as const;

export interface BackupTargetView {
  providerCode: string;
  status: string;
  remoteRef: string | null;
  error: string | null;
}

export interface BackupRunView {
  id: string;
  triggeredById: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  fileName: string | null;
  sizeBytes: number | null;
  checksum: string | null;
  migrationName: string | null;
  status: string;
  error: string | null;
  /** A SUCCESS run where at least one place failed (visible per target). */
  partlyFailed: boolean;
  /** Any place still holds a fetchable copy (LOCAL file present, or a remote
   * that can download). False once every copy is gone — the LOCAL target also
   * reads FAILED with "file missing on the server". */
  downloadable: boolean;
  targets: BackupTargetView[];
}

export interface BackupSettingsView {
  scheduleEnabled: boolean;
  scheduleTime: string;
  keepLast: number;
  /** Kept for compatibility; true only when `passphraseStatus === 'set'`. */
  passphraseSet: boolean;
  passphraseStatus: PassphraseStatus;
}

export interface RestoreStatusView {
  restoring: boolean;
  needsManualRecovery: boolean;
  last: {
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    error: string | null;
  } | null;
}

export interface ProviderView {
  code: string;
  label: string;
  /** An adapter is registered on this server for the provider. */
  available: boolean;
  capabilities: { delete: boolean; maxPartBytes: number | null };
}
