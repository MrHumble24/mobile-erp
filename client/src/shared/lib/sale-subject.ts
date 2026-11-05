import { unitCode, type UnitCodeRef } from "./unit-code"

/**
 * A sale is either a unit (phone / serial device) or a quantity product (ADR 0030):
 * `device` is null on a quantity sale, which instead carries `model` + `quantity`.
 * This is the single structural place that resolves the two shapes into the name,
 * code and quantity a row/receipt/report shows — no entity import, so every slice
 * (sale, customer, reports) shares it.
 */
export interface SaleSubjectRef {
  device?: ({ model: { brand: string; name: string } } & UnitCodeRef) | null
  model?: { brand: string; name: string } | null
  quantity?: number | null
}

/** "Brand Name" of whatever the sale is, from the unit's model or the quantity product. */
export function saleModelName(sale: SaleSubjectRef): string {
  const model = sale.device?.model ?? sale.model
  return model ? `${model.brand} ${model.name}`.trim() : "—"
}

/** The unit code for a unit sale, or null for a quantity sale. */
export function saleUnitCode(sale: SaleSubjectRef): string | null {
  return sale.device ? unitCode(sale.device) : null
}
