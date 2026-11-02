export interface CustomerView {
  id: string
  name: string
  phone: string | null
  notes: string | null
  createdAt: string
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
}

export interface UpdateCustomerDto {
  name?: string
  phone?: string
  notes?: string
}

export interface CustomerSaleView {
  id: string
  device: {
    imei: string
    model: { brand: string; name: string }
    specs: Record<string, unknown>
  }
  salePrice: string
  soldAt: string
  warranty: { days: number; startsAt: string; endsAt: string } | null
  return: { returnedAt: string; refundAmount: string } | null
}
