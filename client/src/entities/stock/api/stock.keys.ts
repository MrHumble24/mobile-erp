import type { StockFilters } from "../model/stock.types"

export const stockKeys = {
  all: ["stock"] as const,
  lists: () => [...stockKeys.all, "list"] as const,
  list: (filters?: StockFilters) => [...stockKeys.lists(), filters] as const,
  movements: (modelId: string, page: number) =>
    [...stockKeys.all, "movements", modelId, page] as const,
}
