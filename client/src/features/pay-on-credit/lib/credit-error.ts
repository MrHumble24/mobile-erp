import { HttpError } from "@/shared/api/http"

/**
 * Map a `POST /credits` failure to a `credit.*` i18n key (ADR 0035). The server
 * raises distinct 400 messages; we key off their stable fragments. Anything else
 * falls back to the raw message so the cashier still sees what went wrong.
 */
export function creditErrorKey(err: unknown): string | null {
  if (!(err instanceof HttpError) || err.statusCode !== 400) return null
  const m = err.message.toLowerCase()
  if (m.includes("must equal the cart total")) return "credit.errorPlanTotal"
  if (m.includes("in the past")) return "credit.errorPastDue"
  if (m.includes("limit")) return "credit.errorLimit"
  if (m.includes("disabled") || m.includes("switched off") || m.includes("turned off"))
    return "credit.errorDisabled"
  if (m.includes("phone")) return "credit.needsCustomer"
  return null
}
