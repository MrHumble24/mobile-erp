import { httpErrorCode } from "@/shared/api/http"
import { codeKey } from "./repair-error-codes.ts"

/** Server conflict/shift codes → `repairs` i18n keys. Undefined for an unknown
 *  error so the caller can fall back to the server message. */
export function repairErrorKey(err: unknown): string | undefined {
  return codeKey(httpErrorCode(err))
}
