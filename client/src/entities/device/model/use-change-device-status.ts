import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"
import type { ChangeStatusDto, UpdateDeviceDto } from "./device.types"

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
