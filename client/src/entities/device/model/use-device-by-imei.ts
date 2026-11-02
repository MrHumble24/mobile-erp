import { useQuery } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"

export function useDeviceByImei(imei?: string | null) {
  return useQuery({
    queryKey: deviceKeys.byImei(imei || ""),
    queryFn: () => deviceRepository.getByImei(imei || ""),
    enabled: Boolean(imei && imei.length === 15),
  })
}
