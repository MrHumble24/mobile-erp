import { useQuery } from "@tanstack/react-query"
import { deviceRepository } from "../api/device.repository"
import { deviceKeys } from "../api/device.keys"

export function useDeviceByImei(imei?: string | null) {
  const code = imei?.trim() ?? ""
  return useQuery({
    queryKey: deviceKeys.byImei(code),
    queryFn: () => deviceRepository.getByImei(code),
    // Any unit code: an IMEI (15 digits) or a serial number (3-64 chars, ADR 0029).
    enabled: code.length >= 3,
    // A device's status changes under us (sold, consigned); the POS must never act on a stale lookup.
    staleTime: 0,
  })
}
