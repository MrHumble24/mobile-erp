export interface SaleDeviceRef {
  imei: string
  model: { brand: string; name: string }
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
}

export interface ReceiptItem {
  imei: string
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
}

export interface WarrantyLookupView {
  imei: string
  saleId: string
  purchasedAt: string
  salePrice: string
  warranty: { days: number; startsAt: string; endsAt: string } | null
  remainingDays: number
  latestInspection: { grade: string | null; notes: string | null } | null
  alreadyReturned: boolean
}

export interface CreateSaleDto {
  imei: string
  salePrice: number
  customerId?: string
  customer?: { name: string; phone?: string }
  warrantyDays?: number
  notes?: string
  clientMutationId?: string
  expectedVersion?: number
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
  page?: number
  pageSize?: number
}
