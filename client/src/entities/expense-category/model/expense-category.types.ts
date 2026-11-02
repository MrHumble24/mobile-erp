export interface ExpenseCategoryView {
  id: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface CreateExpenseCategoryDto {
  name: string
  description?: string
  sortOrder?: number
}

export interface UpdateExpenseCategoryDto {
  name?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}
