import { HttpError, httpErrorCode } from "@/shared/api/http"

/** `customer-purchases` refuses a unit that is already ours and is not SOLD
 *  (only a sold unit is bought back, ADR 0044). */
const UNIT_EXISTS = "PURCHASE_UNIT_EXISTS"

/** A buy failure's text: the not-sold refusal gets its own translated message;
 *  any other conflict keeps the server sentence (or a generic translated text). */
export function buyErrorMessage(err: unknown, t: (key: string) => string): string {
  if (httpErrorCode(err) === UNIT_EXISTS) return t("purchases.buyNotSold")
  if (err instanceof HttpError && err.statusCode === 409) {
    return err.message || t("purchases.buyConflict")
  }
  return err instanceof Error ? err.message : t("common.error")
}
