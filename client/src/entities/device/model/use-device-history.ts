import { useQuery } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"

export function useDeviceHistory(deviceId?: string | null) {
  return useQuery({
    queryKey: deviceKeys.history(deviceId || ""),
    queryFn: () => deviceRepository.getHistory(deviceId || ""),
    enabled: Boolean(deviceId),
  })
}
