import { useQuery } from "@tanstack/react-query"
import { stockRepository } from "../api/stock.repository"
import { stockKeys } from "../api/stock.keys"
import type { StockFilters } from "./stock.types"

export function useStock(filters?: StockFilters) {
  return useQuery({
    queryKey: stockKeys.list(filters),
    queryFn: () => stockRepository.list(filters),
  })
}
