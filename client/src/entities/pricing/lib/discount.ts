import type { Discount, LevelCode, LevelPrices } from "../model/pricing.types"

/**
 * The checkout money rules (ADR 0034), mirrored from the server's
 * `pricing/lib/checkout-pricing.ts` so the till stops the cashier before the
 * server does and sends a salePrice the server accepts to the cent. All amounts
 * are integer minor units (cents); money never flows through floats here.
 */

/** Major-unit money string/number → integer cents (2dp, half-up). */
export function toCents(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0
  return Math.round(Number(value) * 100)
}

/** Integer cents → major-unit number for a salePrice sent to the server. */
export function fromCents(cents: number): number {
  return cents / 100
}

/** The list price for a line at a level, in cents, or null when none is set. */
export function levelPriceCents(
  prices: LevelPrices | null | undefined,
  level: LevelCode
): number | null {
  const v = prices?.[level]
  return v == null ? null : toCents(v)
}

/** The discount amount in cents (0 when none), rounded like the server. */
export function discountAmountCents(listCents: number, discount: Discount | null): number {
  if (!discount || listCents <= 0) return 0
  if (discount.mode === "PERCENT") return Math.round((listCents * discount.value) / 100)
  return Math.round(discount.value * 100)
}

/** The final line price in cents after a discount (never below zero). */
export function finalPriceCents(listCents: number, discount: Discount | null): number {
  return Math.max(0, listCents - discountAmountCents(listCents, discount))
}

export interface DiscountRules {
  enabled: boolean
  percentAllowed: boolean
  amountAllowed: boolean
  /** The cashier's own ceiling, as a percent. */
  maxPercent: number
  /** The chosen customer's standing discount, as a percent (0 when none). */
  standingPercent: number
  /** `sale.discount.unlimited`: the cashier bypasses the cap. */
  unlimited: boolean
}

/** The effective cap: the larger of the cashier max and the customer's standing. */
export function discountCapPercent(rules: DiscountRules): number {
  return Math.max(rules.maxPercent, rules.standingPercent)
}

/** This discount's size as a percent of the list price (for AMOUNT too). */
export function discountPercent(listCents: number, discount: Discount): number {
  if (discount.mode === "PERCENT") return discount.value
  if (listCents <= 0) return 0
  return (discountAmountCents(listCents, discount) / listCents) * 100
}

/**
 * The i18n error key for a discount the server would reject, or null when it is
 * fine. `errorDiscountTooHigh` carries the cap via `discountCapPercent`.
 */
export function discountError(
  listCents: number,
  discount: Discount | null,
  rules: DiscountRules
): "errorDiscountDisabled" | "errorDiscountAboveList" | "errorDiscountTooHigh" | null {
  if (!discount || discount.value <= 0) return null
  if (!rules.enabled) return "errorDiscountDisabled"
  if (discountAmountCents(listCents, discount) > listCents) return "errorDiscountAboveList"
  if (rules.unlimited) return null
  // tiny tolerance for the AMOUNT→percent division, like the server
  if (discountPercent(listCents, discount) - discountCapPercent(rules) > 0.0001) {
    return "errorDiscountTooHigh"
  }
  return null
}
