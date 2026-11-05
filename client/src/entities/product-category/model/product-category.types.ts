export interface ProductCategoryView {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductCategoryDto {
  name: string
  sortOrder?: number
}

export interface UpdateProductCategoryDto {
  name?: string
  sortOrder?: number
  isActive?: boolean
}
