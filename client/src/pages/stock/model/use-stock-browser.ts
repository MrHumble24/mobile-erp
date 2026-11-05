import * as React from "react"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { useStock } from "@/entities/stock"

/** Owns the stock page's search + category filter and feeds the stock query. */
export function useStockBrowser() {
  const [searchInput, setSearchInput] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined)
  const search = useDebounce(searchInput, 300)

  const filters = {
    search: search.trim() || undefined,
    categoryId,
  }
  const query = useStock(filters)

  return {
    searchInput,
    setSearchInput,
    categoryId,
    setCategoryId,
    query,
  }
}

export type StockBrowser = ReturnType<typeof useStockBrowser>
