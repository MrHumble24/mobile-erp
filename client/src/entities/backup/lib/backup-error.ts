import { HttpError, httpErrorCode } from "@/shared/api/http"

/** The stable `code` the server attaches to a failed `/backups` response. */
export function backupErrorCode(err: unknown): string | undefined {
  return httpErrorCode(err)
}

/** HTTP status of a failed request, or undefined for a non-HTTP error. */
export function errorStatus(err: unknown): number | undefined {
  return err instanceof HttpError ? err.statusCode : undefined
}

type T = (key: string) => string

/** i18n key per stable error code; unknown codes fall back to the raw message. */
const CODE_KEY: Record<string, string> = {
  BACKUP_RUNNING: "backups.errRunning",
  BACKUP_NO_PASSPHRASE: "backups.errNoPassphrase",
  BACKUP_PASSPHRASE_UNREADABLE: "backups.errPassphraseUnreadable",
  BACKUP_TOO_LARGE: "backups.errTooLarge",
  BACKUP_NOT_FOUND: "backups.errNotFound",
  BACKUP_FILE_MISSING: "backups.errFileMissing",
  BACKUP_UPLOAD_NOT_FOUND: "backups.errUploadNotFound",
  RESTORE_CONFIRM_FAILED: "backups.errConfirmFailed",
  BACKUP_FROM_NEWER_VERSION: "backups.errNewerVersion",
  RESTORE_RUNNING: "backups.errRestoreRunning",
  PROVIDER_NOT_CONFIGURED: "backups.errProviderNotConfigured",
  PROVIDER_LOCAL_LOCKED: "backups.errLocalLocked",
  PROVIDER_NOT_CONNECTED: "backups.errProviderNotConnected",
  BACKUP_CHAT_IS_STAFF_CHAT: "backups.errChatIsStaffChat",
  OAUTH_NOT_SUPPORTED: "backups.errOauthNotSupported",
  OAUTH_RETURN_URL_INVALID: "backups.errOauthReturnUrl",
}

/** A human message for a failed backup call: a known code's text, a 429 hint,
 * else the server's own message. */
export function backupErrorMessage(err: unknown, t: T): string {
  const code = backupErrorCode(err)
  if (code && CODE_KEY[code]) return t(CODE_KEY[code])
  if (errorStatus(err) === 429) return t("backups.errTooManyTries")
  return err instanceof Error ? err.message : t("common.error")
}
