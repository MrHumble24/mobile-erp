export interface SupplierView {
  id: string
  name: string
  country: string | null
  contact: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierDto {
  name: string
  country?: string
  contact?: string
  notes?: string
}

export interface UpdateSupplierDto {
  name?: string
  country?: string
  contact?: string
  notes?: string
  isActive?: boolean
}
