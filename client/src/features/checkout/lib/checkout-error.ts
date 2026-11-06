import { httpErrorCode } from "../../../shared/api/http.ts"

/** Server checkout refusals → `pos` i18n keys. Undefined for an unknown code. */
const CHECKOUT_ERROR_KEYS: Record<string, string> = {
  BONUS_DISABLED: "pos.bonusErrorDisabled",
  BONUS_NO_CUSTOMER: "pos.bonusErrorNoCustomer",
  BONUS_REDEEM_EXCEEDS_BALANCE: "pos.bonusErrorExceedsBalance",
  BONUS_REDEEM_EXCEEDS_MAX: "pos.bonusErrorExceedsMax",
  BONUS_REDEEM_EXCEEDS_DUE: "pos.bonusErrorExceedsDue",
  BONUS_REDEEM_OFFLINE: "pos.bonusErrorOffline",
  TRADE_IN_FORBIDDEN: "pos.tradeInErrorForbidden",
  TRADE_IN_NO_CUSTOMER: "pos.tradeInErrorNoCustomer",
  TRADE_IN_OFFLINE: "pos.tradeInErrorOffline",
  TRADE_IN_EXCEEDS_SALE: "pos.tradeInErrorExceedsSale",
  // A trade-in of a unit that is already ours and not sold (same write path as buying a phone).
  PURCHASE_UNIT_EXISTS: "purchases.buyNotSold",
}

/** The i18n key for a checkout failure's stable server `code`, when known. A
 *  `code` string is also accepted so callers that already carry one work. */
export function checkoutErrorKey(errorOrCode: unknown): string | undefined {
  const code = typeof errorOrCode === "string" ? errorOrCode : httpErrorCode(errorOrCode)
  return code ? CHECKOUT_ERROR_KEYS[code] : undefined
}
