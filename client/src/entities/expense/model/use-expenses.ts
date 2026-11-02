import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { expenseRepository } from "../api/expense.repository"
import { expenseKeys } from "../api/expense.keys"
import type {
  CreateExpenseDto,
  ExpenseFilters,
  UpdateExpenseDto,
} from "./expense.types"

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseRepository.list(filters),
  })
}

export function useExpenseSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: expenseKeys.summary(params),
    queryFn: () => expenseRepository.summary(params),
  })
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => expenseRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.summaries() })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseDto }) =>
      expenseRepository.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.summaries() })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expenseRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.summaries() })
    },
  })
}
