import * as React from "react"
import { useSearchParams } from "react-router"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { UserListFilters } from "@/entities/user"

export type ActiveFilter = "all" | "active" | "inactive"

const DEFAULT_PAGE_SIZE = 25

function toActive(value: ActiveFilter): boolean | undefined {
  if (value === "active") return true
  if (value === "inactive") return false
  return undefined
}

export interface UsersFiltersState {
  search: string
  role: string
  active: ActiveFilter
  page: number
  pageSize: number
  setSearch: (v: string) => void
  setRole: (v: string) => void
  setActive: (v: ActiveFilter) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  /** Server query params derived from the active filters (search debounced). */
  queryFilters: UserListFilters
}

/** URL-backed users filter + pagination state. The page's single source of filters. */
export function useUsersFilters(): UsersFiltersState {
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
  const [search, setSearch] = React.useState(urlSearch)
  const debouncedSearch = useDebounce(search, 300)
  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) patch({ q: debouncedSearch || null })
  }, [debouncedSearch, urlSearch, patch])

  const role = params.get("role") ?? "all"
  const active = (params.get("active") as ActiveFilter | null) ?? "all"
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const queryFilters: UserListFilters = {
    search: urlSearch || undefined,
    role: role === "all" ? undefined : role,
    active: toActive(active),
    page,
    pageSize,
  }

  return {
    search,
    role,
    active,
    page,
    pageSize,
    setSearch,
    setRole: (v) => patch({ role: v === "all" ? null : v }),
    setActive: (v) => patch({ active: v === "all" ? null : v }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => {
      setSearch("")
      setParams({}, { replace: true })
    },
    queryFilters,
  }
}
