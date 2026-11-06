import { HttpError, httpErrorCode } from "@/shared/api/http"

/** The server's 409 code when a sale/credit is attempted with no open shift. */
export const NO_OPEN_SHIFT = "NO_OPEN_SHIFT"

/**
 * True when a failure is the server's "open a shift first" verdict. Handles both
 * a raw HttpError (credit) and a wrapper that copied `statusCode` + `code` off it
 * (checkout's CheckoutLineError).
 */
export function isNoOpenShiftError(err: unknown): boolean {
  const statusCode =
    err instanceof HttpError ? err.statusCode : (err as { statusCode?: number } | null)?.statusCode
  return statusCode === 409 && httpErrorCode(err) === NO_OPEN_SHIFT
}
