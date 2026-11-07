import type { LedgerTransaction } from "../model/ledger.types"

/** Server cost types (server/src/ledger/types: COST_TYPE_CODES): the only row
 *  kinds whose `amount` can be redacted to `null`, and all of them move money
 *  out. Kept in sync so a redacted row still shows the right direction column. */
const COST_TYPE_CODES: ReadonlySet<string> = new Set([
  "PURCHASE",
  "OVERHEAD",
  "DEVICE_EXPENSE",
  "CUSTOMS",
  "CUSTOMER_PURCHASE",
  "REPAIR_OUTSIDE",
])

export type LedgerDirection = "in" | "out" | "unknown"

/** Which way money moves for this row: money in, out, or unknown (a redacted
 *  amount on a type the client does not know). Signed amount decides when it is
 *  readable; known cost types read as out even when the amount is hidden. */
export function transactionDirection(tx: LedgerTransaction): LedgerDirection {
  if (tx.amount != null) {
    const amount = Number(tx.amount)
    if (Number.isNaN(amount)) return "unknown"
    return amount < 0 ? "out" : "in"
  }
  return COST_TYPE_CODES.has(tx.typeCode) ? "out" : "unknown"
}
