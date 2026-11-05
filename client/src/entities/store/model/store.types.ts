export interface StoreView {
  id: string
  name: string
  address: string | null
  phone: string | null
  deactivatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateStoreDto {
  name: string
  address?: string
  phone?: string
}

export interface UpdateStoreDto {
  name?: string
  address?: string
  phone?: string
}
