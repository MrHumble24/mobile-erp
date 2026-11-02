import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { expenseRecurrenceRepository } from "../api/expense-recurrence.repository"
import { expenseKeys } from "../api/expense.keys"
import type {
  CreateExpenseRecurrenceDto,
  UpdateExpenseRecurrenceDto,
} from "./expense.types"

export function useExpenseRecurrences() {
  return useQuery({
    queryKey: expenseKeys.recurrences(),
    queryFn: () => expenseRecurrenceRepository.list(),
  })
}

export function useCreateExpenseRecurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExpenseRecurrenceDto) =>
      expenseRecurrenceRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.recurrences() })
    },
  })
}

export function useUpdateExpenseRecurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseRecurrenceDto }) =>
      expenseRecurrenceRepository.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.recurrences() })
    },
  })
}

export function useGenerateDueExpenses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => expenseRecurrenceRepository.generate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.recurrences() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: expenseKeys.summaries() })
    },
  })
}
