/** Server return refusals that have their own message → `sales` i18n keys.
 *  Any other 409 keeps the generic "sale changed" text. */
const RETURN_ERROR_KEYS: Record<string, string> = {
  SALE_UNIT_BOUGHT_BACK: "sales.returnBoughtBack",
  TRADE_IN_REFUND_FORBIDDEN: "sales.returnTradeInForbidden",
}

/** The i18n key for a return failure's stable server `code`, when known. */
export function returnErrorKey(code?: string): string | undefined {
  return code ? RETURN_ERROR_KEYS[code] : undefined
}
