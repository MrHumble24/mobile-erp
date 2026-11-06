import { http } from "@/shared/api/http"
import type {
  CreateStockTransferDto,
  ListStockTransfersQuery,
  StockTransferView,
} from "../model/stock-transfer.types"

export const stockTransferRepository = {
  list: (query: ListStockTransfersQuery = {}) =>
    http<{ items: StockTransferView[]; total: number }>("/stock-transfers", {
      params: query as Record<string, string | number>,
    }),
  get: (id: string) => http<StockTransferView>(`/stock-transfers/${id}`),
  create: (dto: CreateStockTransferDto) =>
    http<StockTransferView>("/stock-transfers", {
      method: "POST",
      body: dto,
    }),
  receive: (id: string) =>
    http<StockTransferView>(`/stock-transfers/${id}/receive`, {
      method: "POST",
    }),
  cancel: (id: string) =>
    http<StockTransferView>(`/stock-transfers/${id}/cancel`, {
      method: "POST",
    }),
}
