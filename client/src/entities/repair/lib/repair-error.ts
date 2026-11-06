import { httpErrorCode } from "@/shared/api/http"

/** Server conflict/shift codes → `repairs` i18n keys. Undefined for an unknown
 *  error so the caller can fall back to the server message. */
const CODE_KEYS: Record<string, string> = {
  REPAIR_ILLEGAL_MOVE: "repairs.errorIllegalMove",
  REPAIR_TERMINAL: "repairs.errorTerminal",
  REPAIR_BALANCE_OWED: "repairs.errorBalanceOwed",
  REPAIR_NOT_OUTSIDE: "repairs.errorNotOutside",
  NO_OPEN_SHIFT: "repairs.errorNoShift",
}

export function repairErrorKey(err: unknown): string | undefined {
  const code = httpErrorCode(err)
  return code ? CODE_KEYS[code] : undefined
}
