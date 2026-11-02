import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { shipmentRepository } from "../api/shipment.repository"
import { shipmentKeys } from "../api/shipment.keys"
import { deviceKeys } from "@/entities/device"
import type {
  CreateShipmentDto,
  RegisterDevicesDto,
  UpdateShipmentDto,
} from "./shipment.types"

export function useShipments() {
  return useQuery({
    queryKey: shipmentKeys.lists(),
    queryFn: () => shipmentRepository.list(),
  })
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => shipmentRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateShipmentDto) => shipmentRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
    },
  })
}

export function useUpdateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateShipmentDto }) =>
      shipmentRepository.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(variables.id) })
    },
  })
}

export function useAddShipmentDevices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RegisterDevicesDto }) =>
      shipmentRepository.addDevices(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() })
    },
  })
}
