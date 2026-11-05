import type { Prisma } from '../../generated/client/client.js';

type Money = Prisma.Decimal;

/** A model reference on a sale (quantity sale) or under a device (unit sale). */
export interface SaleModelRef {
  brand: string;
  name: string;
  kindCode: string;
}

/** Row shape fetched by the repository for a full sale view. */
export interface SaleRow {
  id: string;
  salePrice: Money;
  landedCostSnapshot: Money;
  listPriceSnapshot: Money | null;
  priceLevelCode: string | null;
  soldAt: Date;
  consignmentId: string | null;
  notes: string | null;
  /** Null for a quantity sale. */
  device: {
    imei: string | null;
    imei2: string | null;
    serialNumber: string | null;
    specs: Prisma.JsonValue;
    model: SaleModelRef;
  } | null;
  /** Pieces sold (quantity sale); null for a unit sale. */
  quantity: number | null;
  /** The quantity product (quantity sale); null for a unit sale. */
  model: SaleModelRef | null;
  customer: { id: string; name: string; phone: string | null } | null;
  soldBy: {
    id: string;
    profile: { firstName: string; lastName: string | null } | null;
  };
  warranty: { days: number; startsAt: Date; endsAt: Date } | null;
  return: {
    returnedAt: Date;
    refundAmount: Money;
    reason: string | null;
    processedBy: {
      id: string;
      profile: { firstName: string; lastName: string | null } | null;
    };
  } | null;
}

export interface SaleReturnView {
  returnedAt: Date;
  refundAmount: Money;
  reason: string | null;
  processedBy: { id: string; name: string };
}

/** One tender line of a sale, derived from its SALE ledger rows. */
export interface SalePayment {
  accountCode: string;
  amount: Money;
}

export interface SaleView {
  id: string;
  /** Null for a quantity sale (see `model` + `quantity`). */
  device: {
    imei: string | null;
    imei2: string | null;
    serialNumber: string | null;
    model: SaleModelRef;
    specs: Prisma.JsonValue;
  } | null;
  /** Set for a quantity sale: the product and how many pieces. */
  model: SaleModelRef | null;
  quantity: number | null;
  customer: { id: string; name: string; phone: string | null } | null;
  salePrice: Money;
  landedCostSnapshot: Money;
  netProfit: Money;
  /** The frozen list price before discount (null when the line had no price). */
  listPrice: Money | null;
  /** Derived: listPrice − salePrice (null when no snapshot). */
  discountAmount: Money | null;
  /** The level the sale was priced at (null for pre-feature sales). */
  priceLevelCode: string | null;
  soldAt: Date;
  soldBy: { id: string; name: string };
  warranty: { days: number; startsAt: Date; endsAt: Date } | null;
  consignmentId: string | null;
  notes: string | null;
  return: SaleReturnView | null;
  /** How the sale was tendered (its SALE ledger rows); [] when none exist. */
  payments: SalePayment[];
}

/** Filters shared by `GET /sales` and `GET /sales/stats`. */
export interface SaleFilters {
  from?: string;
  to?: string;
  soldById?: string;
  customerId?: string;
  channel?: 'retail' | 'b2b';
  search?: string;
  returned?: 'true' | 'false';
  warranty?: 'active' | 'expired';
  page: number;
  pageSize: number;
}

/** Aggregates over the filtered sale set. `netProfit` is redacted per permission. */
export interface SaleStatsView {
  count: number;
  revenue: Money;
  avgPrice: Money;
  returnedCount: number;
  refundTotal: Money;
  netProfit: Money;
}

/** Warranty lookup for a returning customer, keyed by IMEI or serial. */
export interface WarrantyLookupView {
  imei: string | null;
  serialNumber: string | null;
  saleId: string;
  purchasedAt: Date;
  salePrice: Money;
  warranty: { days: number; startsAt: Date; endsAt: Date } | null;
  remainingDays: number;
  latestInspection: { grade: string | null; notes: string | null } | null;
  alreadyReturned: boolean;
}

/** Thermal-printer receipt. No cost/profit fields, ever. */
export interface ReceiptView {
  saleId: string;
  soldAt: Date;
  cashier: string;
  items: {
    imei: string | null;
    imei2: string | null;
    serialNumber: string | null;
    model: string;
    storage: string | null;
    color: string | null;
    /** Pieces, for a quantity sale; null for a unit sale. */
    quantity: number | null;
    price: Money;
  }[];
  total: Money;
  warranty: { days: number; endsAt: Date } | null;
  customer?: { name: string; phone: string | null };
  /** How the sale was tendered (its SALE ledger rows); [] when none exist. */
  payments: SalePayment[];
}

/** Validated checkout input handed to the repository transaction. */
export interface CheckoutInput {
  storeId: string;
  deviceId: string;
  expectedVersion: number;
  salePrice: Money;
  landedCostSnapshot: Money;
  listPriceSnapshot: Money | null;
  priceLevelCode: string | null;
  soldById: string;
  soldAt: Date;
  notes?: string;
  clientMutationId?: string;
  customerId?: string;
  inlineCustomer?: { name: string; phone?: string };
  warranty: { days: number; startsAt: Date; endsAt: Date };
  /** One SALE ledger row posted per line, inside the checkout transaction. */
  payments: SalePayment[];
}

/**
 * A quantity sale: no device, no warranty. The checkout transaction computes
 * the moving-average cost at that moment, sets `landedCostSnapshot = quantity ×
 * average` and posts a SALE stock movement with that per-piece snapshot.
 */
export interface QuantityCheckoutInput {
  storeId: string;
  modelId: string;
  quantity: number;
  salePrice: Money;
  listPriceSnapshot: Money | null;
  priceLevelCode: string | null;
  soldById: string;
  soldAt: Date;
  notes?: string;
  clientMutationId?: string;
  customerId?: string;
  inlineCustomer?: { name: string; phone?: string };
  payments: SalePayment[];
}

export interface ReturnInput {
  saleId: string;
  /** Null for a quantity sale (no device to move). */
  deviceId: string | null;
  expectedVersion: number;
  toStatusCode: string;
  refundAmount: number;
  reason?: string;
  processedById: string;
  storeId: string;
  /** Per-account refund rows (positive magnitudes) posted inside the return tx. */
  refundPostings: SalePayment[];
  /** Quantity sale: restore this many pieces at `unitCost` (a RETURN movement). */
  quantityRestore?: { modelId: string; quantity: number; unitCost: Money };
}
