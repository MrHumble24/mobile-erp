import type { LevelCode } from "@/entities/pricing"
import type { CartLine } from "../model/cart.store"
import { lineFinalPrice } from "./line-pricing"

/**
 * A line whose final price is below its landed cost must be explicitly confirmed
 * before checkout. Only meaningful when the user can see cost. Uses the price the
 * line will actually sell at (list − discount, or the typed price), ADR 0034.
 */
export function isLineBlocked(line: CartLine, canViewCost: boolean, level: LevelCode): boolean {
  if (line.kind !== "unit") return false
  if (!canViewCost || line.device.landedCost == null) return false
  return lineFinalPrice(line, level) < Number(line.device.landedCost) && !line.belowCostConfirmed
}
