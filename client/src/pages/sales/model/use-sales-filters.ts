import * as React from "react"
import { useSearchParams } from "react-router"
import { presetDates, type RangePreset } from "@/shared/lib/date-range"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { SaleFilters } from "@/entities/sale"

export type SaleStatus = "all" | "active" | "returned"
export type WarrantyFilter = "all" | "active" | "expired"
export type ChannelFilter = "retail" | "b2b" | undefined

const DEFAULT_PRESET: RangePreset = "30d"
const DEFAULT_PAGE_SIZE = 50

function statusToReturned(status: SaleStatus): SaleFilters["returned"] {
  if (status === "returned") return "true"
  if (status === "active") return "false"
  return undefined
}

export interface SalesFiltersState {
  preset: RangePreset
  fromDate: string
  toDate: string
  search: string
  channel: ChannelFilter
  status: SaleStatus
  warranty: WarrantyFilter
  soldById?: string
  page: number
  pageSize: number
  setPreset: (p: RangePreset) => void
  setFromDate: (d: string) => void
  setToDate: (d: string) => void
  setSearch: (v: string) => void
  setChannel: (c: ChannelFilter) => void
  setStatus: (s: SaleStatus) => void
  setWarranty: (w: WarrantyFilter) => void
  setSoldById: (id?: string) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  /** Server query params derived from the active filters (search debounced). */
  queryFilters: SaleFilters
}

/** URL-backed sales filter + pagination state. The page's single source of filters. */
export function useSalesFilters(): SalesFiltersState {
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

  const preset = (params.get("preset") as RangePreset | null) ?? DEFAULT_PRESET
  const urlFrom = params.get("from") ?? ""
  const urlTo = params.get("to") ?? ""
  const { fromDate, toDate } = presetDates(preset, urlFrom, urlTo)
  const urlSearch = params.get("q") ?? ""
  // Typed text lives in local state: writing every keystroke to the URL drops
  // characters (setSearchParams' updater sees a stale snapshot between renders).
  const [search, setSearch] = React.useState(urlSearch)
  const debouncedSearch = useDebounce(search, 300)
  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) patch({ q: debouncedSearch || null })
  }, [debouncedSearch, urlSearch, patch])
  const channel = (params.get("channel") as ChannelFilter) ?? undefined
  const status = (params.get("status") as SaleStatus | null) ?? "all"
  const warranty = (params.get("warranty") as WarrantyFilter | null) ?? "all"
  const soldById = params.get("soldById") ?? undefined
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const queryFilters: SaleFilters = {
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
    search: urlSearch || undefined,
    channel,
    returned: statusToReturned(status),
    warranty: warranty === "all" ? undefined : warranty,
    soldById,
    page,
    pageSize,
  }

  return {
    preset,
    fromDate,
    toDate,
    search,
    channel,
    status,
    warranty,
    soldById,
    page,
    pageSize,
    setPreset: (p) =>
      patch(p === "custom" ? { preset: p } : { preset: p, from: null, to: null }),
    setFromDate: (d) => patch({ preset: "custom", from: d }),
    setToDate: (d) => patch({ preset: "custom", to: d }),
    setSearch,
    setChannel: (c) => patch({ channel: c ?? null }),
    setStatus: (s) => patch({ status: s === "all" ? null : s }),
    setWarranty: (w) => patch({ warranty: w === "all" ? null : w }),
    setSoldById: (id) => patch({ soldById: id ?? null }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => {
      setSearch("")
      setParams({}, { replace: true })
    },
    queryFilters,
  }
}
