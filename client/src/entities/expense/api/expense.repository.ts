import { http } from "@/shared/api/http"
import type {
  CreateExpenseDto,
  ExpenseFilters,
  ExpensePage,
  ExpenseSummary,
  ExpenseView,
  UpdateExpenseDto,
} from "../model/expense.types"

export const expenseRepository = {
  list: async (filters?: ExpenseFilters): Promise<ExpensePage> => {
    return http<ExpensePage>("/expenses", {
      params: filters as Record<string, string | number | boolean | undefined>,
    })
  },

  summary: async (params?: { from?: string; to?: string }): Promise<ExpenseSummary> => {
    return http<ExpenseSummary>("/expenses/summary", {
      params,
    })
  },

  get: async (id: string): Promise<ExpenseView> => {
    return http<ExpenseView>(`/expenses/${id}`)
  },

  create: async (dto: CreateExpenseDto): Promise<ExpenseView> => {
    return http<ExpenseView>("/expenses", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdateExpenseDto): Promise<ExpenseView> => {
    return http<ExpenseView>(`/expenses/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  remove: async (id: string): Promise<void> => {
    return http<void>(`/expenses/${id}`, {
      method: "DELETE",
    })
  },
}
