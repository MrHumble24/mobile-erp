import { HttpError } from "@/shared/api/http"

/** The server's 409 code when a sale/credit is attempted with no open shift. */
export const NO_OPEN_SHIFT = "NO_OPEN_SHIFT"

/**
 * True when a failure is the server's "open a shift first" verdict. Handles both
 * a raw HttpError (credit) and a wrapper that copied `statusCode` + `code` off it
 * (checkout's CheckoutLineError).
 */
export function isNoOpenShiftError(err: unknown): boolean {
  if (err instanceof HttpError) {
    return err.statusCode === 409 && (err.data as { code?: string } | undefined)?.code === NO_OPEN_SHIFT
  }
  const e = err as { statusCode?: number; code?: string } | null
  return e?.statusCode === 409 && e?.code === NO_OPEN_SHIFT
}
