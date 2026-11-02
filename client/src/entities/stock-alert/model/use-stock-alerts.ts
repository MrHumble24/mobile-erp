import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { stockAlertRepository } from "../api/stock-alert.repository"
import { stockAlertKeys } from "../api/stock-alert.keys"
import type {
  CreateStockAlertRuleDto,
  UpdateStockAlertRuleDto,
} from "./stock-alert.types"

export function useStockAlertRules() {
  return useQuery({
    queryKey: stockAlertKeys.list(),
    queryFn: () => stockAlertRepository.list(),
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: stockAlertKeys.lowStock(),
    queryFn: () => stockAlertRepository.lowStock(),
  })
}

export function useCreateStockAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateStockAlertRuleDto) =>
      stockAlertRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockAlertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockAlertKeys.lowStock() })
    },
  })
}

export function useUpdateStockAlertRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStockAlertRuleDto }) =>
      stockAlertRepository.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockAlertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: stockAlertKeys.lowStock() })
    },
  })
}
