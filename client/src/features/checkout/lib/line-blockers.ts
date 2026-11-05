import type { CartLine } from "../model/cart.store"

/**
 * A line priced below its landed cost must be explicitly confirmed before checkout.
 * Only meaningful when the user can see cost; otherwise there is nothing to block on.
 */
export function isLineBlocked(line: CartLine, canViewCost: boolean): boolean {
  // A quantity line carries no landed cost in the cart; nothing to block on.
  if (line.kind !== "unit") return false
  if (!canViewCost || line.device.landedCost == null) return false
  return line.salePrice < Number(line.device.landedCost) && !line.belowCostConfirmed
}
