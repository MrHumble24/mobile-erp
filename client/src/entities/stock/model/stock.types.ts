/** Quantity-product stock (ADR 0030). A product's level is the sum of its movements. */

/** One product's current stock level. `averageCost`/`value` are null without the cost permission. */
export interface StockLevelView {
  modelId: string
  brand: string
  name: string
  barcode: string | null
  modelCode: string | null
  categoryId: string | null
  salePrice: string | null
  /** Pieces in stock; may be negative (an offline till may oversell). */
  quantity: number
  averageCost: string | null
  value: string | null
  /** Per-piece prices per level (ADR 0034); null where unset. */
  prices?: { RETAIL: string | null; WHOLESALE: string | null; PARTNER: string | null }
}

/** One signed movement row; `unitCostSnapshot` is null without the cost permission. */
export interface StockMovement {
  id: string
  typeCode: string
  typeLabel: string
  quantity: number
  unitCostSnapshot: string | null
  shipmentId: string | null
  saleId: string | null
  note: string | null
  occurredAt: string
  createdBy: { id: string; name: string }
}

export interface StockMovementPage {
  items: StockMovement[]
  total: number
  page: number
  pageSize: number
}

export interface StockFilters {
  categoryId?: string
  search?: string
}

export type StockAdjustType = "WRITE_OFF" | "COUNT_CORRECTION"

/** A write-off needs `quantity` + `note`; a count correction sends `countedQuantity`. */
export interface AdjustStockDto {
  modelId: string
  type: StockAdjustType
  quantity?: number
  countedQuantity?: number
  note?: string
}

/** Per-piece prices per level (ADR 0034); null where unset. */
export type ProductLevelPrices = {
  RETAIL: string | null
  WHOLESALE: string | null
  PARTNER: string | null
}

/** The quantity product the scan endpoint returns for a barcode. */
export interface StockScanProduct {
  modelId: string
  brand: string
  name: string
  barcode: string | null
  salePrice: string | null
  quantity: number
  prices?: ProductLevelPrices
}

/** A product row from GET /sync/changes products[] — written into the offline cache. */
export interface ProductChange {
  modelId: string
  brand: string
  name: string
  barcode: string | null
  salePrice: string | null
  quantity: number
  prices?: ProductLevelPrices
}
