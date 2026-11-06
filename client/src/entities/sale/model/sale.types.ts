export interface SaleDeviceRef {
  imei: string | null
  imei2?: string | null
  serialNumber?: string | null
  model: { brand: string; name: string; kindCode?: string }
  specs: Record<string, unknown>
}

export interface SaleCustomerRef {
  id: string
  name: string
  phone: string | null
}

export interface SaleWarrantyRef {
  days: number
  startsAt: string
  endsAt: string
}

export interface SaleReturnRef {
  returnedAt: string
  refundAmount: string
  reason: string | null
  processedBy: { id: string; name: string }
}

/** One tender line, derived from the sale's SALE ledger rows. `amount` is a decimal string. */
export interface SalePaymentLine {
  accountCode: string
  amount: string
}

/** Loyalty points a sale earned and spent (ADR 0043), as 2-dp decimal strings. */
export interface SaleBonus {
  earned: string
  spent: string
}

/** The product sold on a quantity sale (ADR 0030); set when `device` is null. */
export interface SaleModelRef {
  brand: string
  name: string
  kindCode?: string
}

/** A phone taken in part payment (ADR 0039). `value` is customer-facing (not cost-redacted). */
export interface TradeInView {
  deviceId: string
  imei: string | null
  serialNumber: string | null
  model: { brand: string; name: string; kindCode?: string }
  value: string
}

export interface SaleView {
  id: string
  /** Null for a quantity sale, which carries `model` + `quantity` instead (ADR 0030). */
  device: SaleDeviceRef | null
  /** Set only on a quantity sale. */
  model: SaleModelRef | null
  /** Pieces sold, set only on a quantity sale. */
  quantity: number | null
  customer: SaleCustomerRef | null
  salePrice: string
  /** The list price before discount, snapshotted at checkout (ADR 0034); null when no list price. */
  listPrice?: string | null
  /** Derived (listPrice − salePrice); present when a list price was snapshotted. */
  discountAmount?: string | null
  /** The price level the sale was tendered at. */
  priceLevelCode?: string | null
  landedCostSnapshot?: string
  netProfit?: string
  soldAt: string
  soldBy: { id: string; name: string }
  warranty: SaleWarrantyRef | null
  consignmentId: string | null
  /** The credit this sale belongs to, or null for an ordinary paid sale (ADR 0035). */
  creditId?: string | null
  notes: string | null
  return: SaleReturnRef | null
  /** How the sale was tendered; [] when the sale predates ledger posting. */
  payments: SalePaymentLine[]
  /** Phones taken in part payment (ADR 0039); [] when none. */
  tradeIns: TradeInView[]
  /** Loyalty points earned and spent on this sale (ADR 0043). */
  bonus: SaleBonus
}

export interface SaleStats {
  count: number
  revenue: string
  avgPrice: string
  returnedCount: number
  refundTotal: string
  /** Absent for callers without `sale.profit.view` (redacted server-side). */
  netProfit?: string
}

export interface ReceiptItem {
  imei: string | null
  imei2?: string | null
  serialNumber?: string | null
  model: string
  storage: string | null
  color: string | null
  /** Pieces sold, set only on a quantity-product line (ADR 0030). */
  quantity?: number | null
  /** Line total (quantity × price per piece for a quantity line). */
  price: string
  /** Per-item warranty, set only on combined multi-sale receipts (server receipts carry it at the top level). */
  warranty?: { days: number; endsAt: string } | null
}

export interface ReceiptView {
  saleId: string
  soldAt: string
  cashier: string
  items: ReceiptItem[]
  total: string
  /** Sum of list prices and total discount, when a discount was given (ADR 0034). */
  listPrice?: string | null
  discountAmount?: string | null
  priceLevelCode?: string | null
  warranty: { days: number; endsAt: string } | null
  customer?: { name: string; phone: string | null }
  /** How the sale was tendered; [] when the sale predates ledger posting. */
  payments?: SalePaymentLine[]
  /** Phones taken in part payment (ADR 0039); [] when none. */
  tradeIns?: TradeInView[]
  /** Loyalty points earned and spent on this sale (ADR 0043). */
  bonus: SaleBonus
}

export interface WarrantyLookupView {
  imei: string | null
  serialNumber?: string | null
  saleId: string
  purchasedAt: string
  salePrice: string
  warranty: { days: number; startsAt: string; endsAt: string } | null
  remainingDays: number
  latestInspection: { grade: string | null; notes: string | null } | null
  alreadyReturned: boolean
}

export interface CreateSaleDto {
  /** Say what is sold exactly one way: imei / serialNumber (ADR 0029), or modelId+quantity (ADR 0030). */
  imei?: string
  serialNumber?: string
  /** A quantity product: send with `quantity`; `salePrice` is then the line total. */
  modelId?: string
  quantity?: number
  salePrice: number
  customerId?: string
  customer?: { name: string; phone?: string }
  warrantyDays?: number
  notes?: string
  clientMutationId?: string
  expectedVersion?: number
  /** Omit for a single CASH payment of the full price; else amounts must sum to salePrice. */
  payments?: { accountCode: string; amount: number }[]
  /** The price level to resolve the list price at (default: customer's, else RETAIL). ADR 0034. */
  priceLevelCode?: string
  /** A discount off the list price. Needs discounts enabled + its mode allowed. */
  discount?: { mode: "PERCENT" | "AMOUNT"; value: number }
  /** Only honoured on the offline-replay path: the list price the till used. */
  listPrice?: number
  /**
   * Phones taken in part payment (ADR 0039). Their values lower what the
   * customer pays: `payments` must sum to `salePrice` − Σ values. A customer
   * (id or inline) is required. Online only — never queued for sync.
   */
  tradeIns?: SaleTradeInDto[]
  /**
   * Points spent on this sale (ADR 0043): the customer's own money, not a
   * discount. `payments` must then sum to `salePrice` − Σ trade-in values −
   * `bonusRedeem`. Requires a customer and is online only.
   */
  bonusRedeem?: number
}

/** One phone given in part payment; enters stock at `value`. */
export interface SaleTradeInDto {
  modelId: string
  imei?: string
  imei2?: string
  serialNumber?: string
  specs?: Record<string, unknown>
  value: number
}

export interface ReturnSaleDto {
  refundAmount: number
  reason?: string
  deviceToStatusCode: "IN_STOCK" | "DEFECTIVE"
  expectedVersion?: number
}

export interface SalePage {
  items: SaleView[]
  total: number
  page: number
  pageSize: number
}

export interface SaleFilters {
  from?: string
  to?: string
  soldById?: string
  customerId?: string
  channel?: "retail" | "b2b"
  search?: string
  returned?: "true" | "false"
  warranty?: "active" | "expired"
  page?: number
  pageSize?: number
}
