import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { stockRepository } from "../api/stock.repository"
import { stockKeys } from "../api/stock.keys"

export function useStockMovements(modelId: string | null, page: number, pageSize = 20) {
  return useQuery({
    queryKey: stockKeys.movements(modelId ?? "", page),
    queryFn: () => stockRepository.movements(modelId as string, page, pageSize),
    enabled: Boolean(modelId),
    placeholderData: keepPreviousData,
  })
}
