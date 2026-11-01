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
