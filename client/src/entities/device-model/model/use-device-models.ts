import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deviceModelRepository } from "../api/device-model.repository"
import { deviceModelKeys } from "../api/device-model.keys"
import type { CreateDeviceModelDto, DeviceModelView, UpdateDeviceModelDto } from "./device-model.types"

export function useDeviceModels() {
  return useQuery({
    queryKey: deviceModelKeys.lists(),
    queryFn: () => deviceModelRepository.list(),
  })
}

/** The attribute schema for one model, read from the cached models list. */
export function useDeviceModelAttributes(modelId: string | undefined) {
  const { data, isLoading } = useDeviceModels()
  const model = modelId ? data?.find((m) => m.id === modelId) : undefined
  return { attributes: model?.attributes ?? [], model, isLoading }
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

export function useUploadDeviceModelImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      deviceModelRepository.uploadImage(id, file),
    onSuccess: (updated) => {
      queryClient.setQueryData<DeviceModelView[]>(deviceModelKeys.lists(), (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      )
      queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
    },
  })
}

export function useRemoveDeviceModelImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deviceModelRepository.removeImage(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<DeviceModelView[]>(deviceModelKeys.lists(), (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      )
      queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
    },
  })
}

export function useUploadDeviceModelColorImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, color, file }: { id: string; color: string; file: File }) =>
      deviceModelRepository.uploadColorImage(id, color, file),
    onSuccess: (updated) => {
      queryClient.setQueryData<DeviceModelView[]>(deviceModelKeys.lists(), (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      )
      queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
    },
  })
}

export function useRemoveDeviceModelColorImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) =>
      deviceModelRepository.removeColorImage(id, color),
    onSuccess: (updated) => {
      queryClient.setQueryData<DeviceModelView[]>(deviceModelKeys.lists(), (old) =>
        old ? old.map((m) => (m.id === updated.id ? updated : m)) : [updated]
      )
      queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
    },
  })
}
