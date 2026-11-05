import { http } from "@/shared/api/http"
import type {
  AdjustStockDto,
  StockFilters,
  StockLevelView,
  StockMovementPage,
} from "../model/stock.types"

type QueryParams = Record<string, string | number | boolean | undefined | null>

export const stockRepository = {
  list: async (filters?: StockFilters): Promise<StockLevelView[]> => {
    return http<StockLevelView[]>("/stock", { params: filters as QueryParams })
  },

  movements: async (
    modelId: string,
    page: number,
    pageSize: number
  ): Promise<StockMovementPage> => {
    return http<StockMovementPage>(`/stock/${modelId}/movements`, {
      params: { page, pageSize },
    })
  },

  adjust: async (dto: AdjustStockDto): Promise<StockLevelView> => {
    return http<StockLevelView>("/stock/adjust", { method: "POST", body: dto })
  },
}
