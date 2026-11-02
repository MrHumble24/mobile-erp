import { http } from "@/shared/api/http"
import type {
  CreateExpenseRecurrenceDto,
  ExpenseRecurrenceView,
  UpdateExpenseRecurrenceDto,
} from "../model/expense.types"

export const expenseRecurrenceRepository = {
  list: async (): Promise<ExpenseRecurrenceView[]> => {
    return http<ExpenseRecurrenceView[]>("/expense-recurrences")
  },

  create: async (
    dto: CreateExpenseRecurrenceDto
  ): Promise<ExpenseRecurrenceView> => {
    return http<ExpenseRecurrenceView>("/expense-recurrences", {
      method: "POST",
      body: dto,
    })
  },

  update: async (
    id: string,
    dto: UpdateExpenseRecurrenceDto
  ): Promise<ExpenseRecurrenceView> => {
    return http<ExpenseRecurrenceView>(`/expense-recurrences/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  generate: async (): Promise<{ generated: number }> => {
    return http<{ generated: number }>("/expense-recurrences/generate", {
      method: "POST",
    })
  },
}
