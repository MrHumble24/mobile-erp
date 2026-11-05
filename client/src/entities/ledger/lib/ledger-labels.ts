/** Maps stable server codes to `balance` i18n keys. Unknown code → undefined; caller
 *  falls back to the server-supplied label so new accounts/types render untranslated. */

const ACCOUNT_KEYS: Record<string, string> = {
  CASH: "balance.accountCash",
  CARD: "balance.accountCard",
}

const TYPE_KEYS: Record<string, string> = {
  OPENING: "balance.typeOpening",
  DEPOSIT: "balance.typeDeposit",
  WITHDRAWAL: "balance.typeWithdrawal",
  CORRECTION: "balance.typeCorrection",
  TRANSFER: "balance.typeTransfer",
  SALE: "balance.typeSale",
  REFUND: "balance.typeRefund",
  PARTNER_PAYMENT: "balance.typePartnerPayment",
  PURCHASE: "balance.typePurchase",
  OVERHEAD: "balance.typeOverhead",
  EXPENSE: "balance.typeExpense",
}

/** Type codes known to the client, for the history type filter. The server owns the
 *  authoritative list; unknown codes still render via the server label on each row. */
export const KNOWN_TYPE_CODES = Object.keys(TYPE_KEYS)

export function accountI18nKey(code: string): string | undefined {
  return ACCOUNT_KEYS[code]
}

export function typeI18nKey(code: string): string | undefined {
  return TYPE_KEYS[code]
}
