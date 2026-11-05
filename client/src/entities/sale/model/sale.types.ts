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

export interface SaleView {
  id: string
  device: SaleDeviceRef
  customer: SaleCustomerRef | null
  salePrice: string
  landedCostSnapshot?: string
  netProfit?: string
  soldAt: string
  soldBy: { id: string; name: string }
  warranty: SaleWarrantyRef | null
  consignmentId: string | null
  notes: string | null
  return: SaleReturnRef | null
  /** How the sale was tendered; [] when the sale predates ledger posting. */
  payments: SalePaymentLine[]
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
  warranty: { days: number; endsAt: string } | null
  customer?: { name: string; phone: string | null }
  /** How the sale was tendered; [] when the sale predates ledger posting. */
  payments?: SalePaymentLine[]
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
  /** Send exactly one of imei / serialNumber (ADR 0029). */
  imei?: string
  serialNumber?: string
  salePrice: number
  customerId?: string
  customer?: { name: string; phone?: string }
  warrantyDays?: number
  notes?: string
  clientMutationId?: string
  expectedVersion?: number
  /** Omit for a single CASH payment of the full price; else amounts must sum to salePrice. */
  payments?: { accountCode: string; amount: number }[]
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
