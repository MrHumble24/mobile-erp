import { HttpError } from "@/shared/api/http"

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
  const data = err instanceof HttpError ? (err.data as { code?: string } | undefined) : undefined
  return data?.code ? CODE_KEYS[data.code] : undefined
}
