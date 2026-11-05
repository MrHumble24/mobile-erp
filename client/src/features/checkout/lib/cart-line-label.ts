import { unitCode } from "@/shared/lib/unit-code"
import type { CartLine } from "../model/cart.store"

/** A short label for a cart line: the unit's code, or the product's name. */
export function cartLineLabel(line: CartLine): string {
  return line.kind === "unit" ? unitCode(line.device) : line.name
}
