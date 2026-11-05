import type { CartLine } from "../model/cart.store"

/**
 * The line total in major units. A unit line is priced whole; a quantity line is
 * `unitPrice × quantity`, computed in cents so the per-piece price never drifts.
 * Pure and dependency-free (type-only import) so the payment maths stays testable.
 */
export function lineTotal(line: CartLine): number {
  if (line.kind === "unit") return line.salePrice || 0
  return (Math.round((line.unitPrice || 0) * 100) * line.quantity) / 100
}
