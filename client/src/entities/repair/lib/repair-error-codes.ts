/** Pure server-code → i18n-key map (alias-free so node:test can import it). */
export const CODE_KEYS: Record<string, string> = {
  REPAIRS_DISABLED: "repairs.disabled",
  REPAIR_ILLEGAL_MOVE: "repairs.errorIllegalMove",
  REPAIR_TERMINAL: "repairs.errorTerminal",
  REPAIR_BALANCE_OWED: "repairs.errorBalanceOwed",
  REPAIR_NOT_OUTSIDE: "repairs.errorNotOutside",
  REPAIR_VERSION_CONFLICT: "repairs.errorVersionConflict",
  NO_OPEN_SHIFT: "repairs.errorNoShift",
}

export function codeKey(code: string | undefined): string | undefined {
  return code ? CODE_KEYS[code] : undefined
}
