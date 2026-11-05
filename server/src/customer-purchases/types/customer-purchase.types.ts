import type { Prisma } from '../../generated/client/client.js';

/** One used unit to bring into stock from a customer (shared by buy + trade-in). */
export interface PurchaseUnitInput {
  imei?: string | null;
  imei2?: string | null;
  /** Already normalised (trimmed, upper-cased) by the service. */
  serialNumber?: string | null;
  modelId: string;
  specs: Record<string, unknown>;
}

/** Everything the write repository needs to create one customer purchase. */
export interface CustomerPurchaseInput {
  storeId: string;
  customerId: string;
  pricePaid: Prisma.Decimal | number;
  unit: PurchaseUnitInput;
  createdById: string;
  occurredAt: Date;
  /** Set when this is a trade-in against a sale; null for a plain purchase. */
  saleId?: string;
  /**
   * The account the money left from (plain purchase). When set, a
   * CUSTOMER_PURCHASE ledger row posts for `pricePaid`. Omit for a trade-in —
   * its value was netted against the sale, so no money moved (ADR 0039).
   */
  ledgerAccountCode?: string;
}

export interface CustomerPurchaseResult {
  purchaseId: string;
  deviceId: string;
}

/** A unit reference on a purchase / trade-in view. */
export interface PurchaseUnitRef {
  deviceId: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  model: { id: string; brand: string; name: string; kindCode: string };
}

/** A customer purchase for the list / detail endpoints. */
export interface CustomerPurchaseView {
  id: string;
  customer: { id: string; name: string; phone: string | null };
  unit: PurchaseUnitRef;
  /** Cost data: redacted (stripped) without `device.cost.view`. */
  pricePaid: string;
  /** The account the money left from; null for a trade-in. */
  accountCode: string | null;
  /** The sale this was a trade-in on; null for a plain purchase. */
  saleId: string | null;
  soldBy: { id: string; name: string };
  occurredAt: Date;
}

export interface CustomerPurchasePage {
  items: CustomerPurchaseView[];
  total: number;
  page: number;
  pageSize: number;
}

/** A trade-in shown on a sale / receipt (value is customer-facing, ADR 0039). */
export interface TradeInView {
  deviceId: string;
  imei: string | null;
  serialNumber: string | null;
  model: { brand: string; name: string; kindCode: string };
  value: string;
}
