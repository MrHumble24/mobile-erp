import { useQuery } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"
import type { DeviceFilters } from "./device.types"

export function useDevices(filters?: DeviceFilters) {
  return useQuery({
    queryKey: deviceKeys.list(filters),
    queryFn: () => deviceRepository.list(filters),
  })
}
