import type { ConsignmentFilters } from "../model/consignment.types"

export const consignmentKeys = {
  all: ["consignments"] as const,
  lists: () => [...consignmentKeys.all, "list"] as const,
  list: (filters?: ConsignmentFilters) => [...consignmentKeys.lists(), filters] as const,
  overdue: () => [...consignmentKeys.all, "overdue"] as const,
  statsAll: () => [...consignmentKeys.all, "stats"] as const,
  stats: (filters?: ConsignmentFilters) => [...consignmentKeys.statsAll(), filters] as const,
  details: () => [...consignmentKeys.all, "detail"] as const,
  detail: (id: string) => [...consignmentKeys.details(), id] as const,
}
