import type { RepairListFilters, RepairReportFilters } from "../model/repair.types"

export const repairKeys = {
  all: ["repairs"] as const,
  lists: () => [...repairKeys.all, "list"] as const,
  list: (filters: RepairListFilters) => [...repairKeys.lists(), filters] as const,
  details: () => [...repairKeys.all, "detail"] as const,
  detail: (id: string) => [...repairKeys.details(), id] as const,
  report: (filters: RepairReportFilters) => [...repairKeys.all, "report", filters] as const,
}
