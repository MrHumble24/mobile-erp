import { HttpError } from "@/shared/api/http"

/**
 * The exact 409 text `customer-purchases` sends when the IMEI/serial belongs to
 * a unit that is not SOLD (only a sold unit is resurrected, ADR 0044). That
 * endpoint sends no `code`, so the message is the only marker.
 */
const UNIT_EXISTS = "A unit with this IMEI or serial number already exists"

/** A buy failure's text: the not-sold refusal gets its own translated message;
 *  any other conflict keeps the server sentence (or a generic translated text). */
export function buyErrorMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof HttpError) {
    if (err.statusCode === 409 && err.message === UNIT_EXISTS) return t("purchases.buyNotSold")
    if (err.statusCode === 409) return err.message || t("purchases.buyConflict")
  }
  return err instanceof Error ? err.message : t("common.error")
}
