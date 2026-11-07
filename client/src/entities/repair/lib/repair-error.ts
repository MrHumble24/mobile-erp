import { httpErrorCode } from "@/shared/api/http"
import { codeKey } from "./repair-error-codes.ts"

/** A repair write that could not reach the server and was queued offline.
 *  Callers treat this as a queued success, not a failure. */
export class RepairQueuedError extends Error {
  constructor() {
    super("repair mutation queued offline")
    this.name = "RepairQueuedError"
  }
}

/** Server conflict/shift codes → `repairs` i18n keys. Undefined for an unknown
 *  error so the caller can fall back to the server message. */
export function repairErrorKey(err: unknown): string | undefined {
  return codeKey(httpErrorCode(err))
}

/** One handler for every repair mutation's error toast. */
export function repairMutationError(
  err: unknown,
  t: (key: string) => string
): { message: string; queued: boolean } {
  if (err instanceof RepairQueuedError) return { message: t("repairs.queuedOffline"), queued: true }
  const key = repairErrorKey(err)
  if (key) return { message: t(key), queued: false }
  return { message: err instanceof Error ? err.message || t("common.error") : t("common.error"), queued: false }
}
