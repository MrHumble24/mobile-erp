import type { Prisma } from '../../generated/client/client.js';

/** Resolved list prices keyed by level code, e.g. `{ RETAIL: "1200.00", ... }`. */
export type ResolvedPrices = Record<string, string | null>;

/** A price level for the pickers (code + label, active, in sortOrder). */
export interface PriceLevelView {
  code: string;
  label: string;
}

/** One product price row as stored (storage "" = any storage). */
export interface ProductPriceEntry {
  storage: string | null;
  levelCode: string;
  price: string;
}

/** The full price picture of a product, for the price-manage screen. */
export interface ProductPricesView {
  modelId: string;
  kindCode: string;
  prices: ProductPriceEntry[];
}

/** A unit's own prices (RETAIL own is its targetPrice). */
export interface UnitPricesView {
  deviceId: string;
  prices: { levelCode: string; price: string }[];
}

/** Context to resolve one unit's list prices. */
export interface UnitPriceContext {
  deviceId: string;
  modelId: string;
  storage: string;
  targetPrice: Prisma.Decimal | null;
  salePrice: Prisma.Decimal | null;
}

/** Context to resolve one product's list prices (no per-unit own price). */
export interface ProductPriceContext {
  modelId: string;
  storage: string;
  salePrice: Prisma.Decimal | null;
}
