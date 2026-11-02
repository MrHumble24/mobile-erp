import type { ExpenseFilters } from "../model/expense.types"

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  summaries: () => [...expenseKeys.all, "summary"] as const,
  summary: (params?: { from?: string; to?: string }) =>
    [...expenseKeys.summaries(), params] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  recurrences: () => [...expenseKeys.all, "recurrence"] as const,
}
