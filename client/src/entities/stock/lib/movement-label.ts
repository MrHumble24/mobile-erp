/** Maps a stock movement type code to its `catalog` i18n key (ADR 0030). */
const KEYS: Record<string, string> = {
  PURCHASE: "catalog.movePurchase",
  SALE: "catalog.moveSale",
  RETURN: "catalog.moveReturn",
  WRITE_OFF: "catalog.moveWriteOff",
  COUNT_CORRECTION: "catalog.moveCount",
}

export function movementLabelKey(typeCode: string): string {
  return KEYS[typeCode] ?? typeCode
}
