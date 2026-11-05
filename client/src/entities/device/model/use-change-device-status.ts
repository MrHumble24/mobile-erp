import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"
import type {
  ChangeStatusDto,
  EditCustomsFeeDto,
  EditExpenseDto,
  UpdateDeviceDto,
} from "./device.types"

export function useChangeDeviceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ChangeStatusDto }) =>
      deviceRepository.changeStatus(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.history(variables.id) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byImeis() })
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDeviceDto }) =>
      deviceRepository.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byImeis() })
    },
  })
}

/** ponytail: invalidates device caches only; shipment totals and ledger refetch
 *  on next focus/remount (siblings can't import each other's keys). */
function useDeviceCostWriteOptions() {
  const queryClient = useQueryClient()
  return {
    onSuccess: (_: unknown, variables: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.byImeis() })
    },
  }
}

export function useEditDeviceExpense() {
  const opts = useDeviceCostWriteOptions()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: EditExpenseDto }) =>
      deviceRepository.editExpense(id, dto),
    ...opts,
  })
}

export function useEditDeviceCustomsFee() {
  const opts = useDeviceCostWriteOptions()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: EditCustomsFeeDto }) =>
      deviceRepository.editCustomsFee(id, dto),
    ...opts,
  })
}
