import * as React from "react"
import { useSearchParams } from "react-router"
import { presetDates, type RangePreset } from "@/shared/lib/date-range"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { ConsignmentFilters } from "@/entities/consignment"

/** `all` = no date bound; otherwise a shared date-range preset. */
export type DatePreset = "all" | RangePreset
/** Status tab: a concrete status, open-past-due, or everything. */
export type StatusFilter = "all" | "OUT" | "SETTLED" | "RETURNED" | "overdue"

const DEFAULT_PAGE_SIZE = 25

export interface ConsignmentFiltersState {
  search: string
  status: StatusFilter
  preset: DatePreset
  fromDate: string
  toDate: string
  partnerId?: string
  page: number
  pageSize: number
  setSearch: (v: string) => void
  setStatus: (s: StatusFilter) => void
  setPreset: (p: DatePreset) => void
  setFromDate: (d: string) => void
  setToDate: (d: string) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  queryFilters: ConsignmentFilters
}

/** URL-backed consignment filter + pagination state (search in local state, debounced). */
export function useConsignmentFilters(): ConsignmentFiltersState {
  const [params, setParams] = useSearchParams()

  const patch = React.useCallback(
    (next: Record<string, string | null>, resetPage = true) => {
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
    },
    [setParams]
  )

  const status = (params.get("status") as StatusFilter | null) ?? "all"
  const preset = (params.get("preset") as DatePreset | null) ?? "all"
  const urlFrom = params.get("from") ?? ""
  const urlTo = params.get("to") ?? ""
  const { fromDate, toDate } =
    preset === "all" ? { fromDate: "", toDate: "" } : presetDates(preset, urlFrom, urlTo)
  const partnerId = params.get("partnerId") ?? undefined
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const urlSearch = params.get("q") ?? ""
  const [search, setSearch] = React.useState(urlSearch)
  const debouncedSearch = useDebounce(search, 300)
  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) patch({ q: debouncedSearch || null })
  }, [debouncedSearch, urlSearch, patch])

  const queryFilters: ConsignmentFilters = {
    partnerId,
    statusCode: status === "all" || status === "overdue" ? undefined : status,
    overdue: status === "overdue" ? true : undefined,
    search: urlSearch || undefined,
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
    page,
    pageSize,
  }

  return {
    search,
    status,
    preset,
    fromDate,
    toDate,
    partnerId,
    page,
    pageSize,
    setSearch,
    setStatus: (s) => patch({ status: s === "all" ? null : s }),
    setPreset: (p) =>
      patch(p === "custom" ? { preset: p } : { preset: p === "all" ? null : p, from: null, to: null }),
    setFromDate: (d) => patch({ preset: "custom", from: d }),
    setToDate: (d) => patch({ preset: "custom", to: d }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => {
      setSearch("")
      setParams({}, { replace: true })
    },
    queryFilters,
  }
}
