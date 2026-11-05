import * as React from "react"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import type { CreditListFilters, CreditStatus } from "@/entities/credit"

export type CreditStatusTab = "all" | CreditStatus

/** Status tab + a client-side customer text search for the credits list. */
export function useCreditsFilters() {
  const [status, setStatus] = React.useState<CreditStatusTab>("all")
  const [search, setSearch] = React.useState("")
  const debounced = useDebounce(search, 250)

  const queryFilters: CreditListFilters = {
    status: status === "all" ? undefined : status,
  }

  return {
    status,
    setStatus,
    search,
    setSearch,
    searchTerm: debounced.trim().toLowerCase(),
    queryFilters,
  }
}
