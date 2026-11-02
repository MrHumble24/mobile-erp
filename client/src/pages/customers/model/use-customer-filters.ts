import * as React from "react"
import { useSearchParams } from "react-router"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { CustomerListFilters } from "@/entities/customer"

export type HasPurchasesFilter = "all" | "yes" | "no"
export type CustomerSort = "recent" | "name"

const DEFAULT_PAGE_SIZE = 20

export interface CustomerFiltersState {
  search: string
  hasPurchases: HasPurchasesFilter
  sort: CustomerSort
  page: number
  pageSize: number
  setSearch: (v: string) => void
  setHasPurchases: (v: HasPurchasesFilter) => void
  setSort: (v: CustomerSort) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  /** Server query params derived from the active filters (search debounced). */
  queryFilters: CustomerListFilters
}

function hasPurchasesValue(v: HasPurchasesFilter): boolean | undefined {
  if (v === "yes") return true
  if (v === "no") return false
  return undefined
}

/** URL-backed customer filter + pagination state. The page's single source. */
export function useCustomerFilters(): CustomerFiltersState {
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

  const urlSearch = params.get("q") ?? ""
  // Typed text lives in local state (same reason as sales): writing every
  // keystroke to the URL drops characters between renders.
  const [search, setSearch] = React.useState(urlSearch)
  const debouncedSearch = useDebounce(search, 300)
  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) patch({ q: debouncedSearch || null })
  }, [debouncedSearch, urlSearch, patch])

  const hasPurchases = (params.get("has") as HasPurchasesFilter | null) ?? "all"
  const sort = (params.get("sort") as CustomerSort | null) ?? "recent"
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const queryFilters: CustomerListFilters = {
    search: urlSearch || undefined,
    hasPurchases: hasPurchasesValue(hasPurchases),
    sort,
    page,
    pageSize,
  }

  return {
    search,
    hasPurchases,
    sort,
    page,
    pageSize,
    setSearch,
    setHasPurchases: (v) => patch({ has: v === "all" ? null : v }),
    setSort: (v) => patch({ sort: v === "recent" ? null : v }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => {
      setSearch("")
      setParams({}, { replace: true })
    },
    queryFilters,
  }
}
