export interface CustomerView {
  id: string
  name: string
  phone: string | null
  notes: string | null
  createdAt: string
  /** The till's default level for this customer (default RETAIL). ADR 0034. */
  priceLevelCode: string
  /** The discount ceiling offered to this customer, a 2-dp percent string. */
  standingDiscountPercent: string
}

/** A customer with purchase aggregates derived server-side from their sales. */
export interface CustomerListItem extends CustomerView {
  purchaseCount: number
  totalSpent: number
  lastPurchaseAt: string | null
  activeWarranties: number
  returnsCount: number
}

export interface CustomerPage {
  items: CustomerListItem[]
  total: number
  page: number
  pageSize: number
}

export interface CustomerStats {
  total: number
  newThisMonth: number
  withPurchases: number
  repeatBuyers: number
}

export interface CustomerListFilters {
  search?: string
  hasPurchases?: boolean
  sort: "recent" | "name"
  page: number
  pageSize: number
}

export interface CreateCustomerDto {
  name: string
  phone?: string
  notes?: string
  priceLevelCode?: string
  standingDiscountPercent?: number
}

export interface UpdateCustomerDto {
  name?: string
  phone?: string
  notes?: string
  priceLevelCode?: string
  standingDiscountPercent?: number
}

export interface CustomerSaleView {
  id: string
  /** Null for a quantity sale, which carries `model` + `quantity` instead (ADR 0030). */
  device: {
    imei: string | null
    serialNumber?: string | null
    model: { brand: string; name: string }
    specs: Record<string, unknown>
  } | null
  model?: { brand: string; name: string } | null
  quantity?: number | null
  salePrice: string
  soldAt: string
  warranty: { days: number; startsAt: string; endsAt: string } | null
  return: { returnedAt: string; refundAmount: string } | null
}
