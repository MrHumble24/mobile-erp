export interface ExpenseCategoryRef {
  id: string
  name: string
}

export interface ExpenseUserRef {
  id: string
  email: string
  profile: { firstName: string; lastName?: string | null } | null
}

export interface ExpenseView {
  id: string
  categoryId: string
  category: ExpenseCategoryRef
  amount: string
  description: string | null
  vendor: string | null
  isRecurring: boolean
  recurrenceId: string | null
  incurredAt: string
  createdById: string
  createdBy: ExpenseUserRef | null
  createdAt: string
  /** Account the money left (its EXPENSE ledger row); derived server-side. */
  accountCode: string
}

export interface ExpenseCategoryTotal {
  categoryId: string
  name: string
  total: number
}

export interface ExpenseDailyPoint {
  date: string
  total: number
}

export interface ExpenseSummary {
  total: number
  previousTotal: number
  count: number
  byCategory: ExpenseCategoryTotal[]
  topCategory: ExpenseCategoryTotal | null
  daily: ExpenseDailyPoint[]
}

export interface ExpensePage {
  items: ExpenseView[]
  total: number
  page: number
  pageSize: number
}

export type ExpenseSortField = "incurredAt" | "amount" | "createdAt"

export interface ExpenseFilters {
  from?: string
  to?: string
  categoryId?: string
  recordedById?: string
  search?: string
  minAmount?: number
  maxAmount?: number
  isRecurring?: boolean
  sort?: ExpenseSortField
  dir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface CreateExpenseDto {
  categoryId: string
  amount: number
  description?: string
  vendor?: string
  isRecurring?: boolean
  incurredAt?: string
  /** Account the money left. Defaults to CASH server-side. */
  accountCode?: string
}

export interface UpdateExpenseDto {
  categoryId?: string
  amount?: number
  description?: string
  vendor?: string
  isRecurring?: boolean
  incurredAt?: string
  /** Moving the account reverses the old ledger row and posts the new. */
  accountCode?: string
}

export type ExpenseFrequency = "monthly" | "weekly"

export interface ExpenseRecurrenceView {
  id: string
  categoryId: string
  category: ExpenseCategoryRef
  amount: string
  description: string | null
  vendor: string | null
  frequency: ExpenseFrequency
  nextDueAt: string
  isActive: boolean
  createdAt: string
  /** Account each generated expense posts against. */
  accountCode: string
}

export interface CreateExpenseRecurrenceDto {
  categoryId: string
  amount: number
  description?: string
  vendor?: string
  frequency: ExpenseFrequency
  nextDueAt: string
  /** Defaults to CASH server-side. */
  accountCode?: string
}

export interface UpdateExpenseRecurrenceDto {
  categoryId?: string
  amount?: number
  description?: string
  vendor?: string
  frequency?: ExpenseFrequency
  nextDueAt?: string
  isActive?: boolean
  accountCode?: string
}
