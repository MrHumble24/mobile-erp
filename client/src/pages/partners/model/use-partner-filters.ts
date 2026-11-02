import * as React from "react"
import { useSearchParams } from "react-router"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { PartnerFilters } from "@/entities/partner"

export type ActiveFilter = "all" | "active" | "inactive"

export interface PartnerFiltersState {
  search: string
  active: ActiveFilter
  overdue: boolean
  setSearch: (v: string) => void
  setActive: (a: ActiveFilter) => void
  setOverdue: (o: boolean) => void
  reset: () => void
  queryFilters: PartnerFilters
}

function activeToBool(a: ActiveFilter): boolean | undefined {
  if (a === "active") return true
  if (a === "inactive") return false
  return undefined
}

/** URL-backed partner directory filters (search debounced, as on /sales). */
export function usePartnerFilters(): PartnerFiltersState {
  const [params, setParams] = useSearchParams()

  const patch = React.useCallback(
    (next: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(next)) {
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

  const active = (params.get("active") as ActiveFilter | null) ?? "all"
  const overdue = params.get("overdue") === "true"
  const urlSearch = params.get("q") ?? ""
  const [search, setSearch] = React.useState(urlSearch)
  const debouncedSearch = useDebounce(search, 300)
  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) patch({ q: debouncedSearch || null })
  }, [debouncedSearch, urlSearch, patch])

  const queryFilters: PartnerFilters = {
    search: urlSearch || undefined,
    active: activeToBool(active),
    overdue: overdue || undefined,
  }

  return {
    search,
    active,
    overdue,
    setSearch,
    setActive: (a) => patch({ active: a === "all" ? null : a }),
    setOverdue: (o) => patch({ overdue: o ? "true" : null }),
    reset: () => {
      setSearch("")
      setParams({}, { replace: true })
    },
    queryFilters,
  }
}
