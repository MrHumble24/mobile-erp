import { useMutation, useQueryClient } from "@tanstack/react-query"
import { stockRepository } from "../api/stock.repository"
import { stockKeys } from "../api/stock.keys"
import type { AdjustStockDto } from "./stock.types"

/** Write-off / count correction (POST /stock/adjust). Invalidates the stock list and movements. */
export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: AdjustStockDto) => stockRepository.adjust(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all })
    },
  })
}
