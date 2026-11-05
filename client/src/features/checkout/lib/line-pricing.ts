import { finalPriceCents, fromCents, levelPriceCents } from "@/entities/pricing"
import type { LevelCode } from "@/entities/pricing"
import type { CartLine, QuantityCartLine } from "../model/cart.store"
import type { LinePrice } from "./payment"

/** A manually-typed quantity line total (cents-safe), for the no-list / override path. */
function typedQuantityTotal(line: QuantityCartLine): number {
  return (Math.round((line.unitPrice || 0) * 100) * line.quantity) / 100
}

/** The list price (cents) for a whole line at a level, or null when the shop set none. */
export function lineListCents(line: CartLine, level: LevelCode): number | null {
  const per = levelPriceCents(line.listPrices, level)
  if (per === null) return null
  return line.kind === "quantity" ? per * line.quantity : per
}

/** True when the shop has a list price for this line at this level. */
export function lineHasList(line: CartLine, level: LevelCode): boolean {
  return lineListCents(line, level) !== null
}

/**
 * The final sendable line total in major units for the current level + discount.
 * No list price (old behaviour) or an active override → the typed price rules;
 * otherwise list price − discount, computed in cents like the server.
 */
export function lineFinalPrice(line: CartLine, level: LevelCode): number {
  const listCents = lineListCents(line, level)
  if (listCents === null || line.overrideActive) {
    return line.kind === "unit" ? line.salePrice || 0 : typedQuantityTotal(line)
  }
  return fromCents(finalPriceCents(listCents, line.discount ?? null))
}

/** Projects cart lines onto the id + the amount-to-pay the payment maths needs. */
export function toLinePrices(lines: CartLine[], level: LevelCode): LinePrice[] {
  return lines.map((line) => ({ lineId: line.lineId, salePrice: lineFinalPrice(line, level) }))
}

/** The per-line discount amount in major units (0 when no list price or no discount). */
export function lineDiscount(line: CartLine, level: LevelCode): number {
  const listCents = lineListCents(line, level)
  if (listCents === null || line.overrideActive) return 0
  return fromCents(listCents - finalPriceCents(listCents, line.discount ?? null))
}

export interface CartTotals {
  listTotal: number
  discountTotal: number
  dueTotal: number
}

/**
 * Cart totals in major units: the sum of list prices, the total discount and the
 * amount to pay. A line with no list price counts its typed price as its "list".
 */
export function cartTotals(lines: CartLine[], level: LevelCode): CartTotals {
  let listTotal = 0
  let dueTotal = 0
  for (const line of lines) {
    const listCents = lineListCents(line, level)
    const due = lineFinalPrice(line, level)
    dueTotal += due
    listTotal += listCents === null || line.overrideActive ? due : fromCents(listCents)
  }
  return { listTotal, discountTotal: listTotal - dueTotal, dueTotal }
}
