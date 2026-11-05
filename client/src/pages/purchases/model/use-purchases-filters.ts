import * as React from "react"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { CustomerPurchaseFilters } from "@/entities/customer-purchase"

const PAGE_SIZE = 20

/** Date + search filters for the purchases list; search matches IMEI/serial (exact). */
export function usePurchasesFilters() {
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const debouncedSearch = useDebounce(search, 300)

  // A new filter always resets to the first page.
  const setFromDate = (v: string) => { setFrom(v); setPage(1) }
  const setToDate = (v: string) => { setTo(v); setPage(1) }
  const setSearchTerm = (v: string) => { setSearch(v); setPage(1) }

  const queryFilters: CustomerPurchaseFilters = React.useMemo(
    () => ({
      from: from ? `${from}T00:00:00.000Z` : undefined,
      to: to ? `${to}T23:59:59.999Z` : undefined,
      search: debouncedSearch.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [from, to, debouncedSearch, page]
  )

  return {
    from,
    to,
    search,
    page,
    pageSize: PAGE_SIZE,
    setFrom: setFromDate,
    setTo: setToDate,
    setSearch: setSearchTerm,
    setPage,
    queryFilters,
  }
}

export type PurchasesFiltersState = ReturnType<typeof usePurchasesFilters>
