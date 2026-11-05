import { splitRemaining, type PaymentMethod, type PaymentPart } from "@/entities/ledger"
import type { CartLine } from "../model/cart.store"

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + (line.salePrice || 0), 0)
}

/** Split needs one price to divide, so it only applies to a single-line cart. */
export function splitAllowed(lines: CartLine[]): boolean {
  return lines.length === 1
}

/** The method actually used: a stale "split" on a multi-line cart falls back to cash. */
export function effectiveMethod(method: PaymentMethod, lines: CartLine[]): PaymentMethod {
  if (method === "split" && !splitAllowed(lines)) return "cash"
  return method
}

/** True when the split does not sum to the total, so checkout must be blocked. */
export function isPaymentBlocked(
  lines: CartLine[],
  method: PaymentMethod,
  parts: PaymentPart[]
): boolean {
  if (effectiveMethod(method, lines) !== "split") return false
  return splitRemaining(cartTotal(lines), parts) !== 0
}

/** Payments for one sale line. Undefined = single CASH line of the full price. */
export function linePayments(
  line: CartLine,
  method: PaymentMethod,
  splitParts: PaymentPart[]
): PaymentPart[] | undefined {
  if (method === "cash") return undefined
  if (method === "card") return [{ accountCode: "CARD", amount: line.salePrice }]
  return splitParts.filter((p) => p.amount > 0)
}
