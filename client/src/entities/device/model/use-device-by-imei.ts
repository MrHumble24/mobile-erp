import { useQuery } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"

export function useDeviceByImei(imei?: string | null) {
  return useQuery({
    queryKey: deviceKeys.byImei(imei || ""),
    queryFn: () => deviceRepository.getByImei(imei || ""),
    enabled: Boolean(imei && imei.length === 15),
    // A device's status changes under us (sold, consigned); the POS must never act on a stale lookup.
    staleTime: 0,
  })
}
