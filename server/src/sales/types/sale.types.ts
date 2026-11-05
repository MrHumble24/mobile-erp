import type { Prisma } from '../../generated/client/client.js';

type Money = Prisma.Decimal;

/** Row shape fetched by the repository for a full sale view. */
export interface SaleRow {
  id: string;
  salePrice: Money;
  landedCostSnapshot: Money;
  soldAt: Date;
  consignmentId: string | null;
  notes: string | null;
  device: {
    imei: string;
    imei2: string | null;
    specs: Prisma.JsonValue;
    model: { brand: string; name: string };
  };
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
  device: {
    imei: string;
    imei2: string | null;
    model: { brand: string; name: string };
    specs: Prisma.JsonValue;
  };
  customer: { id: string; name: string; phone: string | null } | null;
  salePrice: Money;
  landedCostSnapshot: Money;
  netProfit: Money;
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

/** Warranty lookup for a returning customer, keyed by IMEI. */
export interface WarrantyLookupView {
  imei: string;
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
    imei: string;
    imei2: string | null;
    model: string;
    storage: string | null;
    color: string | null;
    price: Money;
  }[];
  total: Money;
  warranty: { days: number; endsAt: Date } | null;
  customer?: { name: string; phone: string | null };
}

/** Validated checkout input handed to the repository transaction. */
export interface CheckoutInput {
  storeId: string;
  deviceId: string;
  expectedVersion: number;
  salePrice: number;
  landedCostSnapshot: Money;
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

export interface ReturnInput {
  saleId: string;
  deviceId: string;
  expectedVersion: number;
  toStatusCode: string;
  refundAmount: number;
  reason?: string;
  processedById: string;
  storeId: string;
  /** Per-account refund rows (positive magnitudes) posted inside the return tx. */
  refundPostings: SalePayment[];
}
