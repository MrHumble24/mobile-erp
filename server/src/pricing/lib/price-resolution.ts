import { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;

/** "" means "any storage" — the only form for quantity/no-storage products. */
export const ANY_STORAGE = '';

/**
 * Everything needed to resolve one unit's (or product's) list prices for every
 * level. Built by the repository from the stored columns and rows:
 * - `own`: the unit's own price per level. RETAIL own is `Device.targetPrice`;
 *   WHOLESALE/PARTNER own are `unit_prices` rows. Empty for a quantity product.
 * - `product`: product prices keyed by `${storage}\0${level}`. The RETAIL
 *   "any storage" entry is `DeviceModel.salePrice`; the rest are
 *   `product_prices` rows (incl. a phone's per-storage RETAIL price).
 */
export interface PriceInputs {
  own: Map<string, Decimal>;
  product: Map<string, Decimal>;
}

/** Key for the `product` map. */
export function productKey(storage: string, level: string): string {
  return `${storage}\u0000${level}`;
}

/**
 * The list price of a unit at one level and storage (ADR 0034), in order:
 *   1. the unit's own price at that level,
 *   2. the product price for its storage at that level,
 *   3. the product price for "any storage" at that level,
 *   4. none.
 * For a quantity product pass an empty `own` map and `ANY_STORAGE`.
 */
export function resolveListPrice(
  level: string,
  storage: string,
  inputs: PriceInputs,
): Decimal | null {
  const own = inputs.own.get(level);
  if (own !== undefined) return own;
  if (storage !== ANY_STORAGE) {
    const byStorage = inputs.product.get(productKey(storage, level));
    if (byStorage !== undefined) return byStorage;
  }
  return inputs.product.get(productKey(ANY_STORAGE, level)) ?? null;
}

/** Resolve every active level into a `{ CODE: "0.00" | null }` map. */
export function resolveAllLevels(
  levelCodes: readonly string[],
  storage: string,
  inputs: PriceInputs,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const code of levelCodes) {
    const price = resolveListPrice(code, storage, inputs);
    out[code] = price === null ? null : price.toFixed(2);
  }
  return out;
}
