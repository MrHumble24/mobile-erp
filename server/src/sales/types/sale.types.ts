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
    specs: Prisma.JsonValue;
    model: { brand: string; name: string };
  };
  customer: { id: string; name: string; phone: string | null } | null;
  soldBy: {
    id: string;
    profile: { firstName: string; lastName: string | null } | null;
  };
  warranty: { days: number; startsAt: Date; endsAt: Date } | null;
  return: { saleId: string } | null;
}

export interface SaleView {
  id: string;
  device: {
    imei: string;
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
}

export interface ReturnInput {
  saleId: string;
  deviceId: string;
  expectedVersion: number;
  toStatusCode: string;
  refundAmount: number;
  reason?: string;
  processedById: string;
}
