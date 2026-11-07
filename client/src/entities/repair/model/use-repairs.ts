import { useQuery } from "@tanstack/react-query"
import { repairRepository } from "../api/repair.repository"
import { repairKeys } from "../api/repair.keys"
import type { RepairListFilters, RepairReportFilters } from "./repair.types"

/** Paged repair list, newest first (`repair.read`). */
export function useRepairs(filters: RepairListFilters) {
  return useQuery({
    queryKey: repairKeys.list(filters),
    queryFn: () => repairRepository.list(filters),
  })
}

/** One repair ticket with its parts, payments, history and derived money. */
export function useRepair(id: string | null) {
  return useQuery({
    queryKey: repairKeys.detail(id ?? ""),
    queryFn: () => {
      if (!id) throw new Error("A repair id is required")
      return repairRepository.get(id)
    },
    enabled: Boolean(id),
  })
}

/** Store-wide repair income (and cost/profit when the caller may see cost). */
export function useRepairReport(filters: RepairReportFilters) {
  return useQuery({
    queryKey: repairKeys.report(filters),
    queryFn: () => repairRepository.report(filters),
  })
}
