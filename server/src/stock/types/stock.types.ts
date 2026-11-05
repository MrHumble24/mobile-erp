import type { Prisma } from '../../generated/client/client.js';

/** One quantity product with its current stock in the current store. */
export interface StockLevelView {
  modelId: string;
  brand: string;
  name: string;
  barcode: string | null;
  modelCode: string | null;
  categoryId: string | null;
  /** Default till price per piece (ADR 0030); null when unset. */
  salePrice: string | null;
  /** Pieces in stock; may be negative (oversold) — the UI flags it. */
  quantity: number;
  /** Moving-average cost per piece; null without the cost permission. */
  averageCost: string | null;
  /** Σ(quantity × unitCostSnapshot); null without the cost permission. */
  value: string | null;
}

/** One stock movement row, newest first. */
export interface StockMovementView {
  id: string;
  typeCode: string;
  typeLabel: string;
  /** Signed pieces. */
  quantity: number;
  /** Cost per piece frozen at the movement; null without the cost permission. */
  unitCostSnapshot: string | null;
  shipmentId: string | null;
  saleId: string | null;
  note: string | null;
  occurredAt: Date;
  createdBy: { id: string; name: string } | null;
}

export interface StockMovementsPage {
  items: StockMovementView[];
  total: number;
  page: number;
  pageSize: number;
}

/** Raw per-model aggregate from the stock list query. */
export interface StockLevelRow {
  modelId: string;
  brand: string;
  name: string;
  barcode: string | null;
  modelCode: string | null;
  categoryId: string | null;
  salePrice: Prisma.Decimal | null;
  quantity: number;
  value: Prisma.Decimal;
  latestPurchaseCost: Prisma.Decimal;
}

/** A movement ready to append; `occurredAt` defaults to now. */
export interface StockMovementInput {
  storeId: string;
  modelId: string;
  typeCode: string;
  quantity: number;
  unitCostSnapshot: Prisma.Decimal | number;
  shipmentId?: string;
  saleId?: string;
  note?: string;
  createdById: string;
  occurredAt?: Date;
}

/** One quantity purchase line inside a shipment. */
export interface PurchaseLineInput {
  modelId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchasedLineView {
  modelId: string;
  quantity: number;
  unitCost: string;
}

/** The scan answer when a code resolves to a quantity product (ADR 0030). */
export interface QuantityProductView {
  modelId: string;
  brand: string;
  name: string;
  barcode: string | null;
  salePrice: string | null;
  quantity: number;
}
