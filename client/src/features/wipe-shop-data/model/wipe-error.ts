import { backupErrorCode, backupErrorMessage, errorStatus } from "@/entities/backup"

type T = (key: string) => string

/** i18n key per wipe-specific code; everything else (the safety backup's own
 * codes, 429, raw message) falls through to the shared backup mapper. */
const CODE_KEY: Record<string, string> = {
  DATA_WIPE_CONFIRM_FAILED: "backups.errConfirmFailed",
  DATA_WIPE_RUNNING: "backups.wipeErrRunning",
  DATA_WIPE_NO_PASSPHRASE: "backups.wipeErrNoPassphrase",
  DATA_WIPE_PASSPHRASE_UNREADABLE: "backups.errPassphraseUnreadable",
}

/** A human message for a failed erase. */
export function wipeErrorMessage(err: unknown, t: T): string {
  const code = backupErrorCode(err)
  if (code && CODE_KEY[code]) return t(CODE_KEY[code])
  if (errorStatus(err) === 429) return t("backups.errTooManyTries")
  return backupErrorMessage(err, t)
}
