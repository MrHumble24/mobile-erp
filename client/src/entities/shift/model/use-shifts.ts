import { useQuery } from "@tanstack/react-query"
import { shiftRepository } from "../api/shift.repository"
import { shiftKeys } from "../api/shift.keys"
import type { ShiftListFilters } from "./shift.types"

/**
 * My open shift with live figures, or null (`sale.create`). Disabled when shifts
 * are off. Every sale, refund and expense moves the expected cash, so each
 * screen that mounts this re-reads it instead of trusting the cache.
 */
export function useCurrentShift(enabled = true) {
  return useQuery({
    queryKey: shiftKeys.current(),
    queryFn: () => shiftRepository.current(),
    enabled,
    refetchOnMount: "always",
  })
}

/** Paged shifts list, newest first (`sale.read`). */
export function useShifts(filters: ShiftListFilters) {
  return useQuery({
    queryKey: shiftKeys.list(filters),
    queryFn: () => shiftRepository.list(filters),
  })
}

/** One shift's full report (`sale.read`; own, or any with `shift.manage`). */
export function useShiftReport(id: string | null) {
  return useQuery({
    queryKey: shiftKeys.detail(id ?? ""),
    queryFn: () => shiftRepository.report(id as string),
    enabled: Boolean(id),
  })
}
