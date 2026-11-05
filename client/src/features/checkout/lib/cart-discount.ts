import type { Discount } from "@/entities/pricing"

/**
 * Spread a whole-cart discount over lines in proportion to their list prices,
 * as integer cents (ADR 0034). The parts add up **exactly** to the cart
 * discount — the remainder from flooring goes to the largest fractional shares —
 * so the sale never loses or invents money. Lines with no list price get zero.
 */
export function spreadCartDiscount(listCentsPerLine: number[], cartDiscountCents: number): number[] {
  const total = listCentsPerLine.reduce((sum, c) => sum + Math.max(0, c), 0)
  if (total <= 0 || cartDiscountCents <= 0) return listCentsPerLine.map(() => 0)

  const capped = Math.min(cartDiscountCents, total)
  const raw = listCentsPerLine.map((c) => (Math.max(0, c) * capped) / total)
  const floors = raw.map(Math.floor)
  let remainder = capped - floors.reduce((sum, f) => sum + f, 0)

  const byFraction = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
  for (let k = 0; k < remainder && k < byFraction.length; k++) floors[byFraction[k].i]++
  return floors
}

/** The whole-cart discount in cents from a {mode,value}, capped at the cart list total. */
export function cartDiscountCents(listTotalCents: number, discount: Discount | null): number {
  if (!discount || discount.value <= 0 || listTotalCents <= 0) return 0
  const raw =
    discount.mode === "PERCENT"
      ? Math.round((listTotalCents * discount.value) / 100)
      : Math.round(discount.value * 100)
  return Math.min(raw, listTotalCents)
}
