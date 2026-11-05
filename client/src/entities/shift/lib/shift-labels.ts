/** Maps shift movement codes to `balance.*` i18n keys. Per-entity label map
 *  (same pattern as stock's movement-label and ledger's ledger-labels), because
 *  entities may not import one another. Unknown code → the raw code. */

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
  DEVICE_EXPENSE: "balance.typeDeviceExpense",
  CUSTOMS: "balance.typeCustoms",
  SHIFT_DIFFERENCE: "balance.typeShiftDifference",
}

const ACCOUNT_KEYS: Record<string, string> = {
  CASH: "balance.accountCash",
  CARD: "balance.accountCard",
}

export function shiftTypeLabel(code: string, t: (key: string) => string): string {
  const key = TYPE_KEYS[code]
  return key ? t(key) : code
}

export function shiftAccountLabel(code: string, t: (key: string) => string): string {
  const key = ACCOUNT_KEYS[code]
  return key ? t(key) : code
}
