import * as React from "react"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { RepairListFilters, RepairStatusCode } from "@/entities/repair"

export type RepairStatusTab = "all" | RepairStatusCode

/** Status tab + date range + server-side search + pagination for the repairs
 *  list. Any filter change returns to page 1 so the result set never looks
 *  empty just because the user was on a later page. */
export function useRepairsFilters() {
  const [status, setStatusRaw] = React.useState<RepairStatusTab>("all")
  const [from, setFromRaw] = React.useState("")
  const [to, setToRaw] = React.useState("")
  const [search, setSearchRaw] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSizeRaw] = React.useState(50)
  const debounced = useDebounce(search, 300)

  const resetPage = () => setPage(1)
  const setStatus = (v: RepairStatusTab) => { setStatusRaw(v); resetPage() }
  const setFrom = (v: string) => { setFromRaw(v); resetPage() }
  const setTo = (v: string) => { setToRaw(v); resetPage() }
  const setSearch = (v: string) => { setSearchRaw(v); resetPage() }
  const setPageSize = (v: number) => { setPageSizeRaw(v); resetPage() }

  const queryFilters: RepairListFilters = {
    status: status === "all" ? undefined : status,
    from: from || undefined,
    to: to || undefined,
    search: debounced.trim() || undefined,
    page,
    pageSize,
  }

  const clearAll = () => {
    setStatusRaw("all")
    setFromRaw("")
    setToRaw("")
    setSearchRaw("")
    setPage(1)
  }

  return {
    status,
    setStatus,
    from,
    setFrom,
    to,
    setTo,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    clearDates: () => { setFromRaw(""); setToRaw(""); resetPage() },
    clearAll,
    hasFilters: status !== "all" || Boolean(from || to || debounced.trim()),
    queryFilters,
  }
}

export type RepairsFiltersState = ReturnType<typeof useRepairsFilters>
