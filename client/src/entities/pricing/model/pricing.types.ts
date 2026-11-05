/** Price levels and discounts (ADR 0034). */

export type LevelCode = "RETAIL" | "WHOLESALE" | "PARTNER"

/** Resolved prices for one unit/product, null where no price is set. */
export type LevelPrices = { [K in LevelCode]: string | null }

/** The level picker options from GET /pricing/levels. */
export interface PriceLevel {
  code: string
  label: string
}

export type DiscountMode = "PERCENT" | "AMOUNT"

/** A discount the cashier applies to a line (or the whole cart). */
export interface Discount {
  mode: DiscountMode
  value: number
}

/** GET /pricing/products/:modelId — one price per (storage, level); storage null = any. */
export interface ProductPricesView {
  modelId: string
  kindCode: string
  prices: { storage: string | null; levelCode: string; price: string }[]
}

/** PUT /pricing/products/:modelId — set all in one call; price null clears. */
export interface PutProductPricesDto {
  prices: { storage?: string | null; levelCode: string; price: number | null }[]
}

/** GET /pricing/units/:deviceId — a unit's own prices (RETAIL = targetPrice). */
export interface UnitPricesView {
  deviceId: string
  prices: { levelCode: string; price: string }[]
}

/** PUT /pricing/units/:deviceId — price null clears (uses the product price). */
export interface PutUnitPricesDto {
  prices: { levelCode: string; price: number | null }[]
}
