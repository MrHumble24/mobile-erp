import { useSearchParams } from "react-router"
import { localDayEnd, localDayStart } from "@/shared/lib/local-date"
import type { ShiftListFilters } from "@/entities/shift"

const DEFAULT_PAGE_SIZE = 20

export interface ShiftsFiltersState {
  cashierId?: string
  fromDate: string
  toDate: string
  page: number
  pageSize: number
  setCashierId: (id?: string) => void
  setFromDate: (d: string) => void
  setToDate: (d: string) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  queryFilters: ShiftListFilters
}

/** URL-backed shifts list filters + pagination. The cashier filter is only
 *  honoured by the server for callers with `shift.manage`. */
export function useShiftsFilters(): ShiftsFiltersState {
  const [params, setParams] = useSearchParams()

  const patch = (next: Record<string, string | null>, resetPage = true) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        const merged = resetPage ? { page: null, ...next } : next
        for (const [k, v] of Object.entries(merged)) {
          if (v === null || v === "") p.delete(k)
          else p.set(k, v)
        }
        return p
      },
      { replace: true }
    )
  }

  const cashierId = params.get("cashier") ?? undefined
  const fromDate = params.get("from") ?? ""
  const toDate = params.get("to") ?? ""
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const queryFilters: ShiftListFilters = {
    cashierId,
    from: localDayStart(fromDate),
    to: localDayEnd(toDate),
    page,
    pageSize,
  }

  return {
    cashierId,
    fromDate,
    toDate,
    page,
    pageSize,
    setCashierId: (id) => patch({ cashier: id ?? null }),
    setFromDate: (d) => patch({ from: d }),
    setToDate: (d) => patch({ to: d }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => setParams({}, { replace: true }),
    queryFilters,
  }
}
