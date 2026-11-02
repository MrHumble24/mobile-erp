import type { DeviceFilters } from "../model/device.types"

export const deviceKeys = {
  all: ["devices"] as const,
  lists: () => [...deviceKeys.all, "list"] as const,
  list: (filters?: DeviceFilters) => [...deviceKeys.lists(), filters] as const,
  details: () => [...deviceKeys.all, "detail"] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  byImei: (imei: string) => [...deviceKeys.all, "by-imei", imei] as const,
  history: (id: string) => [...deviceKeys.all, "history", id] as const,
}
