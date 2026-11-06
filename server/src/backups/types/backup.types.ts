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

export type PassphraseStatus = 'set' | 'missing' | 'unreadable';

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
