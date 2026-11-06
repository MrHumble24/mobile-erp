/** Server checkout refusals → `pos` i18n keys. Undefined for an unknown code. */
const CHECKOUT_ERROR_KEYS: Record<string, string> = {
  BONUS_DISABLED: "pos.bonusErrorDisabled",
  BONUS_NO_CUSTOMER: "pos.bonusErrorNoCustomer",
  BONUS_REDEEM_EXCEEDS_BALANCE: "pos.bonusErrorExceedsBalance",
  BONUS_REDEEM_EXCEEDS_MAX: "pos.bonusErrorExceedsMax",
  BONUS_REDEEM_EXCEEDS_DUE: "pos.bonusErrorExceedsDue",
  BONUS_REDEEM_OFFLINE: "pos.bonusErrorOffline",
}

/** The i18n key for a checkout failure's stable server `code`, when known. */
export function checkoutErrorKey(code?: string): string | undefined {
  return code ? CHECKOUT_ERROR_KEYS[code] : undefined
}
