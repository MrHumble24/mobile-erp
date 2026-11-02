export interface CustomerView {
  id: string
  name: string
  phone: string | null
  notes: string | null
  createdAt: string
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
}

