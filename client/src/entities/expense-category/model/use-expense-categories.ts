import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { expenseCategoryRepository } from "../api/expense-category.repository"
import { expenseCategoryKeys } from "../api/expense-category.keys"
import type {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from "./expense-category.types"

export function useExpenseCategories() {
  return useQuery({
    queryKey: expenseCategoryKeys.list(),
    queryFn: () => expenseCategoryRepository.list(),
  })
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseCategoryDto) =>
      expenseCategoryRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseCategoryDto }) =>
      expenseCategoryRepository.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}
