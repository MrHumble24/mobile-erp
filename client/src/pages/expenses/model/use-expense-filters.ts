import * as React from "react"
import { useSearchParams } from "react-router"
import { presetDates, type RangePreset } from "@/shared/lib/date-range"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { ExpenseFilters, ExpenseSortField } from "@/entities/expense"

export type RecurringFilter = "all" | "recurring" | "one-off"
export type SortValue = `${ExpenseSortField}:${"asc" | "desc"}`

const DEFAULT_PRESET: RangePreset = "30d"
const DEFAULT_SORT: SortValue = "incurredAt:desc"
const DEFAULT_PAGE_SIZE = 50

function recurringToBool(value: RecurringFilter): boolean | undefined {
  if (value === "recurring") return true
  if (value === "one-off") return false
  return undefined
}

export interface ExpenseFiltersState {
  preset: RangePreset
  fromDate: string
  toDate: string
  search: string
  categoryId?: string
  recordedById?: string
  recurring: RecurringFilter
  minAmount: string
  maxAmount: string
  sort: SortValue
  page: number
  pageSize: number
  setPreset: (p: RangePreset) => void
  setFromDate: (d: string) => void
  setToDate: (d: string) => void
  setSearch: (v: string) => void
  setCategoryId: (id?: string) => void
  setRecordedById: (id?: string) => void
  setRecurring: (r: RecurringFilter) => void
  setMinAmount: (v: string) => void
  setMaxAmount: (v: string) => void
  setSort: (s: SortValue) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  queryFilters: ExpenseFilters
  summaryParams: { from?: string; to?: string }
}

/** URL-backed expenses filter + pagination state. The page's single source of filters. */
export function useExpenseFilters(): ExpenseFiltersState {
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
  const { fromDate, toDate } = presetDates(
    preset,
    params.get("from") ?? "",
    params.get("to") ?? ""
  )

  // Text / numeric inputs live in local state; a debounced effect writes the URL
  // (writing every keystroke to the URL drops characters between renders).
  const urlSearch = params.get("q") ?? ""
  const urlMin = params.get("min") ?? ""
  const urlMax = params.get("max") ?? ""
  const [search, setSearch] = React.useState(urlSearch)
  const [minAmount, setMinAmount] = React.useState(urlMin)
  const [maxAmount, setMaxAmount] = React.useState(urlMax)
  const debounced = useDebounce({ q: search, min: minAmount, max: maxAmount }, 300)
  React.useEffect(() => {
    if (debounced.q !== urlSearch || debounced.min !== urlMin || debounced.max !== urlMax) {
      patch({ q: debounced.q || null, min: debounced.min || null, max: debounced.max || null })
    }
  }, [debounced, urlSearch, urlMin, urlMax, patch])

  const categoryId = params.get("category") ?? undefined
  const recordedById = params.get("recordedBy") ?? undefined
  const recurring = (params.get("recurring") as RecurringFilter | null) ?? "all"
  const sort = (params.get("sort") as SortValue | null) ?? DEFAULT_SORT
  const [sortField, sortDir] = sort.split(":") as [ExpenseSortField, "asc" | "desc"]
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const summaryParams = {
    from: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
    to: toDate ? `${toDate}T23:59:59.999Z` : undefined,
  }

  const queryFilters: ExpenseFilters = {
    ...summaryParams,
    categoryId,
    recordedById,
    search: urlSearch || undefined,
    minAmount: urlMin ? Number(urlMin) : undefined,
    maxAmount: urlMax ? Number(urlMax) : undefined,
    isRecurring: recurringToBool(recurring),
    sort: sortField,
    dir: sortDir,
    page,
    pageSize,
  }

  return {
    preset,
    fromDate,
    toDate,
    search,
    categoryId,
    recordedById,
    recurring,
    minAmount,
    maxAmount,
    sort,
    page,
    pageSize,
    setPreset: (p) =>
      patch(p === "custom" ? { preset: p } : { preset: p, from: null, to: null }),
    setFromDate: (d) => patch({ preset: "custom", from: d }),
    setToDate: (d) => patch({ preset: "custom", to: d }),
    setSearch,
    setCategoryId: (id) => patch({ category: id ?? null }),
    setRecordedById: (id) => patch({ recordedBy: id ?? null }),
    setRecurring: (r) => patch({ recurring: r === "all" ? null : r }),
    setMinAmount,
    setMaxAmount,
    setSort: (s) => patch({ sort: s === DEFAULT_SORT ? null : s }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => {
      setSearch("")
      setMinAmount("")
      setMaxAmount("")
      setParams({}, { replace: true })
    },
    queryFilters,
    summaryParams,
  }
}
