import type { ShiftListFilters } from "../model/shift.types"

export const shiftKeys = {
  all: ["shifts"] as const,
  current: () => [...shiftKeys.all, "current"] as const,
  lists: () => [...shiftKeys.all, "list"] as const,
  list: (filters: ShiftListFilters) => [...shiftKeys.lists(), filters] as const,
  details: () => [...shiftKeys.all, "detail"] as const,
  detail: (id: string) => [...shiftKeys.details(), id] as const,
}
