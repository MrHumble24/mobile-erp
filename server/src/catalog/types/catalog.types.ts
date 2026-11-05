import type { Prisma } from '../../generated/client/client.js';

/**
 * One product card on the till grid. Identity is shared by every kind; the
 * price fields differ: an IMEI/SERIAL product shows the min–max target price of
 * its in-stock units, a QUANTITY product shows its single default `salePrice`.
 * `inStock` is the IN_STOCK unit count for IMEI/SERIAL, the summed quantity (may
 * be zero or negative) for QUANTITY.
 */
export interface CatalogEntry {
  modelId: string;
  brand: string;
  name: string;
  kindCode: string;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  inStock: number;
  minTargetPrice: string | null;
  maxTargetPrice: string | null;
  salePrice: string | null;
}

/** One in-stock unit the seller picks after tapping an IMEI/SERIAL card. */
export interface CatalogUnit {
  id: string;
  /** IMEI or serial number — the one printed/scannable code. */
  code: string | null;
  specs: unknown;
  /** Latest QC cosmetic grade, or null when the unit was never inspected. */
  gradeCode: string | null;
  targetPrice: string | null;
}

/** Raw row for an IMEI/SERIAL product with at least one IN_STOCK unit. */
export interface UnitProductRow {
  modelId: string;
  brand: string;
  name: string;
  kindCode: string;
  categoryId: string | null;
  categoryName: string | null;
  imageFileName: string | null;
  inStock: number;
  minTargetPrice: Prisma.Decimal | null;
  maxTargetPrice: Prisma.Decimal | null;
}

/** Raw row for an active QUANTITY product and its summed stock. */
export interface QuantityProductRow {
  modelId: string;
  brand: string;
  name: string;
  kindCode: string;
  categoryId: string | null;
  categoryName: string | null;
  imageFileName: string | null;
  salePrice: Prisma.Decimal | null;
  quantity: number;
}

/** Raw row for one IN_STOCK unit of a product. */
export interface UnitRow {
  id: string;
  imei: string | null;
  serialNumber: string | null;
  specs: Prisma.JsonValue;
  gradeCode: string | null;
  targetPrice: Prisma.Decimal | null;
}
