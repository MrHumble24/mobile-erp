/**
 * Backup & restore shapes, mirroring the server's `/backups` responses
 * (ADR 0051 / 0056). Dates arrive as ISO strings over JSON.
 */

export type PassphraseStatus = "set" | "missing" | "unreadable"

export interface BackupTargetView {
  providerCode: string
  /** PENDING | UPLOADED | FAILED */
  status: string
  remoteRef: string | null
  error: string | null
}

export interface BackupRunView {
  id: string
  triggeredById: string | null
  startedAt: string
  finishedAt: string | null
  fileName: string | null
  sizeBytes: number | null
  checksum: string | null
  migrationName: string | null
  /** RUNNING | SUCCESS | FAILED */
  status: string
  error: string | null
  /** A SUCCESS run where at least one place failed. */
  partlyFailed: boolean
  /** Some place still holds a fetchable copy. */
  downloadable: boolean
  targets: BackupTargetView[]
}

export interface BackupSettingsView {
  scheduleEnabled: boolean
  scheduleTime: string
  keepLast: number
  passphraseSet: boolean
  passphraseStatus: PassphraseStatus
}

export interface RestoreStatusView {
  restoring: boolean
  needsManualRecovery: boolean
  last: {
    status: string
    startedAt: string
    finishedAt: string | null
    error: string | null
  } | null
}

export interface PlaceCapabilities {
  list: boolean
  download: boolean
  delete: boolean
  maxPartBytes: number | null
}

/** Non-secret place settings (chat id, connected account, folder). */
export interface ProviderSettings {
  chatId?: string
  folderId?: string
  folderName?: string
  accountName?: string
  accountEmail?: string
}

export interface PlaceView {
  code: string
  label: string
  available: boolean
  configured: boolean
  connected: boolean
  enabled: boolean
  /** OK | NEEDS_RECONNECT | ERROR | NEVER_USED */
  status: string
  lastSuccessAt: string | null
  lastError: string | null
  capabilities: PlaceCapabilities
  settings: ProviderSettings
  /** LOCAL — always on, cannot be switched off. */
  locked: boolean
}

/** The server's reply after staging a `.mbk` upload (step 1 of 2). */
export interface StagedUpload {
  uploadId: string
  createdAt: string
  sizeBytes: number
  migrationName: string | null
}

export interface ConfirmRestoreDto {
  shopName: string
  password: string
}

export const RUN_STATUS = {
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const

export const PLACE_STATUS = {
  OK: "OK",
  NEEDS_RECONNECT: "NEEDS_RECONNECT",
  ERROR: "ERROR",
  NEVER_USED: "NEVER_USED",
} as const

export const TARGET_STATUS = {
  PENDING: "PENDING",
  UPLOADED: "UPLOADED",
  FAILED: "FAILED",
} as const

/** The write-only secret kinds a place may hold (server `SetPlaceSecretDto`). */
export type PlaceSecretKind = "botToken" | "clientId" | "clientSecret"

/** OAuth providers; others are Telegram / LOCAL. */
export const OAUTH_CODES = ["GOOGLE_DRIVE", "ONEDRIVE"] as const

/** Stable error codes returned under `code` in a failed response body. */
export const BACKUP_ERROR = {
  RUNNING: "BACKUP_RUNNING",
  NO_PASSPHRASE: "BACKUP_NO_PASSPHRASE",
  PASSPHRASE_UNREADABLE: "BACKUP_PASSPHRASE_UNREADABLE",
  TOO_LARGE: "BACKUP_TOO_LARGE",
  NOT_FOUND: "BACKUP_NOT_FOUND",
  FILE_MISSING: "BACKUP_FILE_MISSING",
  UPLOAD_NOT_FOUND: "BACKUP_UPLOAD_NOT_FOUND",
  RESTORE_CONFIRM_FAILED: "RESTORE_CONFIRM_FAILED",
  FROM_NEWER_VERSION: "BACKUP_FROM_NEWER_VERSION",
  RESTORE_RUNNING: "RESTORE_RUNNING",
  MAINTENANCE: "MAINTENANCE",
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  PROVIDER_LOCAL_LOCKED: "PROVIDER_LOCAL_LOCKED",
  PROVIDER_NOT_CONNECTED: "PROVIDER_NOT_CONNECTED",
  CHAT_IS_STAFF_CHAT: "BACKUP_CHAT_IS_STAFF_CHAT",
  OAUTH_NOT_SUPPORTED: "OAUTH_NOT_SUPPORTED",
  OAUTH_RETURN_URL_INVALID: "OAUTH_RETURN_URL_INVALID",
} as const
