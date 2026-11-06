import type { LinePrice } from "./payment"

/** One sale line for the points planner: its total and what is left after trade-ins. */
export interface RedeemLine {
  lineId: string
  /** The line's total (after discount). */
  price: number
  /** The line's price minus its trade-ins: what the customer still owes. */
  due: number
}

export interface RedeemPlan {
  /** The most the customer may spend on this cart. */
  max: number
  /** What will be spent: `requested`, kept between 0 and `max`. */
  total: number
  /** lineId → points on that line (only lines with points). */
  byLine: Record<string, number>
  /** Per line: due minus its points; what cash/card must cover. */
  payableLines: LinePrice[]
}

/** Integer minor units, so amounts never drift through float arithmetic. */
const toCents = (amount: number): number => Math.round(amount * 100)
const fromCents = (cents: number): number => cents / 100

/**
 * Plan how a cart's bonus points are spent, mirroring the server's per-sale
 * limits (ADR 0043): a line may take at most `maxPercent` of its price (half-up
 * to the cent) and never more than it still owes; the cart may take at most the
 * customer's balance. The requested amount is clamped, then shared out in cart
 * order. Pure, all maths in integer cents.
 */
export function planBonusRedeem(
  lines: RedeemLine[],
  requested: number,
  balance: number,
  maxPercent: number
): RedeemPlan {
  const requestedCents = Number.isFinite(requested) ? Math.max(0, toCents(requested)) : 0
  const balanceCents = Number.isFinite(balance) ? Math.max(0, toCents(balance)) : 0
  const percent = Number.isFinite(maxPercent) ? Math.max(0, maxPercent) : 0

  const caps = lines.map((line) => {
    const priceCents = Math.max(0, toCents(line.price))
    const dueCents = Math.max(0, toCents(line.due))
    const percentCap = Math.round((priceCents * percent) / 100)
    return Math.min(percentCap, dueCents)
  })
  const capSum = caps.reduce((sum, cap) => sum + cap, 0)
  const maxCents = Math.min(balanceCents, capSum)
  const totalCents = Math.min(requestedCents, maxCents)

  let remaining = totalCents
  const byLine: Record<string, number> = {}
  const payableLines: LinePrice[] = []
  lines.forEach((line, index) => {
    const take = Math.min(remaining, caps[index])
    if (take > 0) byLine[line.lineId] = fromCents(take)
    remaining -= take
    const dueCents = Math.max(0, toCents(line.due))
    payableLines.push({ lineId: line.lineId, salePrice: fromCents(dueCents - take) })
  })

  return {
    max: fromCents(maxCents),
    total: fromCents(totalCents),
    byLine,
    payableLines,
  }
}
