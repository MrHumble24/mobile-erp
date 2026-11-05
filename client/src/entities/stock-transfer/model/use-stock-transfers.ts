import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deviceKeys } from "@/entities/device"
import { stockKeys } from "@/entities/stock"
import { stockTransferKeys } from "../api/stock-transfer.keys"
import { stockTransferRepository } from "../api/stock-transfer.repository"
import type {
  CreateStockTransferDto,
  ListStockTransfersQuery,
} from "./stock-transfer.types"

export function useStockTransfers(query?: ListStockTransfersQuery) {
  return useQuery({
    queryKey: stockTransferKeys.list(query),
    queryFn: () => stockTransferRepository.list(query),
  })
}

export function useStockTransfer(id: string) {
  return useQuery({
    queryKey: stockTransferKeys.detail(id),
    queryFn: () => stockTransferRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateStockTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateStockTransferDto) =>
      stockTransferRepository.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockTransferKeys.all })
      qc.invalidateQueries({ queryKey: deviceKeys.all })
      qc.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}

export function useReceiveStockTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockTransferRepository.receive(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: stockTransferKeys.all })
      qc.invalidateQueries({ queryKey: stockTransferKeys.detail(id) })
      qc.invalidateQueries({ queryKey: deviceKeys.all })
      qc.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}

export function useCancelStockTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockTransferRepository.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: stockTransferKeys.all })
      qc.invalidateQueries({ queryKey: stockTransferKeys.detail(id) })
      qc.invalidateQueries({ queryKey: deviceKeys.all })
      qc.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}
