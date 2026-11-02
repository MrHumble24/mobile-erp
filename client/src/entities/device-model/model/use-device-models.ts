import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deviceModelRepository } from "../api/device-model.repository"
import { deviceModelKeys } from "../api/device-model.keys"
import type { CreateDeviceModelDto, UpdateDeviceModelDto } from "./device-model.types"

export function useDeviceModels() {
  return useQuery({
    queryKey: deviceModelKeys.lists(),
    queryFn: () => deviceModelRepository.list(),
  })
}

export function useCreateDeviceModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDeviceModelDto) => deviceModelRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
    },
  })
}

export function useUpdateDeviceModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDeviceModelDto }) =>
      deviceModelRepository.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
    },
  })
}
