import type { ListStockTransfersQuery } from "../model/stock-transfer.types"

export const stockTransferKeys = {
  all: ["stock-transfers"] as const,
  list: (query?: ListStockTransfersQuery) =>
    [...stockTransferKeys.all, "list", query] as const,
  detail: (id: string) => [...stockTransferKeys.all, "detail", id] as const,
}
