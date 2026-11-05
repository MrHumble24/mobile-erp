import * as React from "react"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { RepairListFilters, RepairStatusCode } from "@/entities/repair"

export type RepairStatusTab = "all" | RepairStatusCode

/** Status tab + date range + a server-side search for the repairs list. */
export function useRepairsFilters() {
  const [status, setStatus] = React.useState<RepairStatusTab>("all")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [search, setSearch] = React.useState("")
  const debounced = useDebounce(search, 300)

  const queryFilters: RepairListFilters = {
    status: status === "all" ? undefined : status,
    from: from || undefined,
    to: to || undefined,
    search: debounced.trim() || undefined,
    page: 1,
    pageSize: 50,
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
    clearDates: () => {
      setFrom("")
      setTo("")
    },
    queryFilters,
  }
}

export type RepairsFiltersState = ReturnType<typeof useRepairsFilters>
