import type { PaymentMethod, PaymentPart } from "@/entities/ledger"
import type { CartLine } from "../model/cart.store"
import { lineTotal } from "./line-total.ts"

/** The two fields the payment maths reads off a cart line: its id and its total. */
export interface LinePrice {
  lineId: string
  salePrice: number
}

/** Projects cart lines (unit or quantity) onto the id+total the payment maths needs. */
export function toLinePrices(lines: CartLine[]): LinePrice[] {
  return lines.map((line) => ({ lineId: line.lineId, salePrice: lineTotal(line) }))
}

/** Integer minor units, so amounts never drift through float arithmetic. */
const toCents = (amount: number): number => Math.round(amount * 100)

export function cartTotal(lines: LinePrice[]): number {
  return lines.reduce((sum, line) => sum + (line.salePrice || 0), 0)
}

/** True when a split's parts do not add up to the cart total; checkout is blocked. */
export function isPaymentBlocked(
  lines: LinePrice[],
  method: PaymentMethod,
  parts: PaymentPart[]
): boolean {
  if (method !== "split") return false
  const assigned = parts.reduce((sum, p) => sum + toCents(p.amount), 0)
  return assigned !== toCents(cartTotal(lines))
}

/**
 * Spread a cart-total split across the line-sales in cart order, cent-exact.
 * Each phone's price is drawn from the parts in their given order (e.g. cash
 * until the cash part is used up, then card); a phone that straddles a part
 * boundary gets two payment lines, every other phone one. Each line's payments
 * therefore sum to its own price — what the server checks. Call only on a
 * balanced split (`isPaymentBlocked` false), else trailing lines fall short.
 */
export function allocateSplit(
  lines: LinePrice[],
  parts: PaymentPart[]
): Record<string, PaymentPart[]> {
  const pool = parts
    .filter((p) => p.amount > 0)
    .map((p) => ({ accountCode: p.accountCode, cents: toCents(p.amount) }))
  const result: Record<string, PaymentPart[]> = {}
  for (const line of lines) {
    let remaining = toCents(line.salePrice)
    const payments: PaymentPart[] = []
    for (const part of pool) {
      if (remaining <= 0) break
      if (part.cents <= 0) continue
      const take = Math.min(remaining, part.cents)
      payments.push({ accountCode: part.accountCode, amount: take / 100 })
      part.cents -= take
      remaining -= take
    }
    result[line.lineId] = payments
  }
  return result
}

/**
 * Payments for every line of the cart, keyed by `lineId`. One source of truth
 * for both the online checkout and the offline outbox.
 * - cash → `undefined` (server posts one CASH line of the full price)
 * - card → one CARD line of the price
 * - split → the cart-total allocation above
 */
export function buildCartPayments(
  lines: LinePrice[],
  method: PaymentMethod,
  parts: PaymentPart[]
): Record<string, PaymentPart[] | undefined> {
  if (method === "split") return allocateSplit(lines, parts)
  const perLine = (line: LinePrice): PaymentPart[] | undefined =>
    method === "card" ? [{ accountCode: "CARD", amount: line.salePrice }] : undefined
  return Object.fromEntries(lines.map((line) => [line.lineId, perLine(line)]))
}
