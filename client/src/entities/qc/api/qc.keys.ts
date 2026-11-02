import type { InspectionFilters, StatsRange } from "../model/qc.types"

export const qcKeys = {
  all: ["qc"] as const,
  inspections: () => [...qcKeys.all, "inspections"] as const,
  inspectionList: (filters?: InspectionFilters) =>
    [...qcKeys.inspections(), filters] as const,
  stats: (range?: StatsRange) => [...qcKeys.all, "stats", range] as const,
  defectTypes: (includeInactive?: boolean) =>
    [...qcKeys.all, "defect-types", includeInactive ?? false] as const,
  grades: (includeInactive?: boolean) =>
    [...qcKeys.all, "grades", includeInactive ?? false] as const,
}
