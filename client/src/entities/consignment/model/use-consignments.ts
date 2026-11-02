import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { consignmentRepository } from "../api/consignment.repository"
import { consignmentKeys } from "../api/consignment.keys"
import { partnerKeys } from "@/entities/partner"
import { deviceKeys } from "@/entities/device"
import type {
  ConsignmentFilters,
  CreateConsignmentDto,
  ReturnConsignmentDto,
  SettleConsignmentDto,
} from "./consignment.types"

export function useConsignments(filters?: ConsignmentFilters) {
  return useQuery({
    queryKey: consignmentKeys.list(filters),
    queryFn: () => consignmentRepository.list(filters),
  })
}

export function useOverdueConsignments() {
  return useQuery({
    queryKey: consignmentKeys.overdue(),
    queryFn: () => consignmentRepository.overdue(),
  })
}

export function useConsignmentStats(filters?: ConsignmentFilters) {
  return useQuery({
    queryKey: consignmentKeys.stats(filters),
    queryFn: () => consignmentRepository.stats(filters),
  })
}

export function useConsignment(id: string) {
  return useQuery({
    queryKey: consignmentKeys.detail(id),
    queryFn: () => consignmentRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateConsignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateConsignmentDto) => consignmentRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consignmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: consignmentKeys.overdue() })
      queryClient.invalidateQueries({ queryKey: consignmentKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: partnerKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

export function useSettleConsignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SettleConsignmentDto }) =>
      consignmentRepository.settle(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consignmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: consignmentKeys.overdue() })
      queryClient.invalidateQueries({ queryKey: consignmentKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: partnerKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}

export function useReturnConsignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReturnConsignmentDto }) =>
      consignmentRepository.returnConsignment(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consignmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: consignmentKeys.overdue() })
      queryClient.invalidateQueries({ queryKey: consignmentKeys.statsAll() })
      queryClient.invalidateQueries({ queryKey: partnerKeys.all })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}
