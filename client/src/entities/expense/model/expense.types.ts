export interface ExpenseCategoryRef {
  id: string
  name: string
}

export interface ExpenseView {
  id: string
  categoryId: string
  category: ExpenseCategoryRef
  amount: string
  description: string | null
  isRecurring: boolean
  incurredAt: string
  createdById: string
  createdAt: string
}

export interface ExpenseCategorySummaryItem {
  categoryId: string
  name: string
  total: number
}

export interface ExpenseSummary {
  total: number
  byCategory: ExpenseCategorySummaryItem[]
}

export interface ExpensePage {
  items: ExpenseView[]
  total: number
  page: number
  pageSize: number
}

export interface ExpenseFilters {
  from?: string
  to?: string
  categoryId?: string
  isRecurring?: boolean
  page?: number
  pageSize?: number
}

export interface CreateExpenseDto {
  categoryId: string
  amount: number
  description?: string
  isRecurring?: boolean
  incurredAt?: string
}

export interface UpdateExpenseDto {
  categoryId?: string
  amount?: number
  description?: string
  isRecurring?: boolean
  incurredAt?: string
}
