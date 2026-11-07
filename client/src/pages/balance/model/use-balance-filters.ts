import { useSearchParams } from "react-router"
import { presetDates, type RangePreset } from "@/shared/lib/date-range"
import { localDayEnd, localDayStart } from "@/shared/lib/local-date"
import type { LedgerFilters, LedgerStatsFilters } from "@/entities/ledger"

const DEFAULT_PRESET: RangePreset = "30d"
const DEFAULT_PAGE_SIZE = 50

export interface BalanceFiltersState {
  preset: RangePreset
  fromDate: string
  toDate: string
  accountCode?: string
  typeCode?: string
  direction?: "in" | "out" | "all"
  search?: string
  page: number
  pageSize: number
  setPreset: (p: RangePreset) => void
  setFromDate: (d: string) => void
  setToDate: (d: string) => void
  setAccountCode: (code?: string) => void
  setTypeCode: (code?: string) => void
  setDirection: (dir?: "in" | "out" | "all") => void
  setSearch: (q?: string) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
  queryFilters: LedgerFilters
  statsFilters: LedgerStatsFilters
}

/** URL-backed balance history filters + pagination. The page's single source of filters. */
export function useBalanceFilters(): BalanceFiltersState {
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

  const preset = (params.get("preset") as RangePreset | null) ?? DEFAULT_PRESET
  const { fromDate, toDate } = presetDates(preset, params.get("from") ?? "", params.get("to") ?? "")
  const accountCode = params.get("account") ?? undefined
  const typeCode = params.get("type") ?? undefined
  const direction = (params.get("dir") as "in" | "out" | "all" | null) ?? undefined
  const search = params.get("q") ?? undefined
  const page = Number(params.get("page") ?? "1")
  const pageSize = Number(params.get("size") ?? String(DEFAULT_PAGE_SIZE))

  const from = localDayStart(fromDate)
  const to = localDayEnd(toDate)

  const queryFilters: LedgerFilters = {
    accountCode,
    typeCode,
    direction: direction === "all" ? undefined : direction,
    search: search?.trim() || undefined,
    from,
    to,
    sort: "occurredAt",
    dir: "desc",
    page,
    pageSize,
  }

  const statsFilters: LedgerStatsFilters = {
    accountCode,
    from,
    to,
  }

  return {
    preset,
    fromDate,
    toDate,
    accountCode,
    typeCode,
    direction,
    search,
    page,
    pageSize,
    setPreset: (p) => patch(p === "custom" ? { preset: p } : { preset: p, from: null, to: null }),
    setFromDate: (d) => patch({ preset: "custom", from: d }),
    setToDate: (d) => patch({ preset: "custom", to: d }),
    setAccountCode: (code) => patch({ account: code ?? null }),
    setTypeCode: (code) => patch({ type: code ?? null }),
    setDirection: (dir) => patch({ dir: dir === "all" || !dir ? null : dir }),
    setSearch: (q) => patch({ q: q ?? null }),
    setPage: (p) => patch({ page: String(p) }, false),
    setPageSize: (n) => patch({ size: String(n) }),
    reset: () => setParams({}, { replace: true }),
    queryFilters,
    statsFilters,
  }
}
