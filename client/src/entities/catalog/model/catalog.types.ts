/**
 * How a product's units are stocked (ADR 0029). Declared locally — not imported
 * from the sibling device-model entity — so catalog stays independent.
 */
export type ProductKind = "IMEI" | "SERIAL" | "QUANTITY"

/**
 * One product card in the till grid (ADR 0031). A unit product carries a price
 * range (`minTargetPrice`/`maxTargetPrice`, `salePrice` null); a quantity
 * product carries `salePrice` (range null) and `inStock` may be ≤ 0.
 */
export interface CatalogEntry {
  modelId: string
  brand: string
  name: string
  kindCode: ProductKind
  categoryId: string | null
  categoryName: string | null
  imageUrl: string | null
  inStock: number
  minTargetPrice: string | null
  maxTargetPrice: string | null
  salePrice: string | null
  /** Product-level prices at "any storage", per level (ADR 0034); null where unset. */
  prices?: { RETAIL: string | null; WHOLESALE: string | null; PARTNER: string | null }
}

/** One in-stock unit of a unit product, picked after tapping a card. */
export interface CatalogUnit {
  id: string
  /** IMEI or serial number. */
  code: string
  specs: Record<string, unknown>
  gradeCode: string | null
  targetPrice: string | null
  /** Prices resolved for this unit's own storage, per level (ADR 0034). */
  prices?: { RETAIL: string | null; WHOLESALE: string | null; PARTNER: string | null }
}

export interface CatalogFilters {
  categoryId?: string
  search?: string
}
