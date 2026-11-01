import { http } from "@/shared/api/http"
import type {
  CreateExpenseCategoryDto,
  ExpenseCategoryView,
  UpdateExpenseCategoryDto,
} from "../model/expense-category.types"

export const expenseCategoryRepository = {
  list: async (): Promise<ExpenseCategoryView[]> => {
    return http<ExpenseCategoryView[]>("/expense-categories")
  },

  create: async (
    dto: CreateExpenseCategoryDto
  ): Promise<ExpenseCategoryView> => {
    return http<ExpenseCategoryView>("/expense-categories", {
      method: "POST",
      body: dto,
    })
  },

  update: async (
    id: string,
    dto: UpdateExpenseCategoryDto
  ): Promise<ExpenseCategoryView> => {
    return http<ExpenseCategoryView>(`/expense-categories/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },
}
