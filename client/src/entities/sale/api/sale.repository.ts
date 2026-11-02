import { http } from "@/shared/api/http"
import type {
  CreateSaleDto,
  ReceiptView,
  ReturnSaleDto,
  SaleFilters,
  SalePage,
  SaleStats,
  SaleView,
  WarrantyLookupView,
} from "../model/sale.types"

type QueryParams = Record<string, string | number | boolean | undefined | null>

export const saleRepository = {
  create: async (dto: CreateSaleDto): Promise<SaleView> => {
    return http<SaleView>("/sales", {
      method: "POST",
      body: dto,
    })
  },

  list: async (filters?: SaleFilters): Promise<SalePage> => {
    return http<SalePage>("/sales", {
      params: filters as QueryParams,
    })
  },

  stats: async (filters?: SaleFilters): Promise<SaleStats> => {
    return http<SaleStats>("/sales/stats", {
      params: filters as QueryParams,
    })
  },

  get: async (id: string): Promise<SaleView> => {
    return http<SaleView>(`/sales/${id}`)
  },

  getReceipt: async (id: string): Promise<ReceiptView> => {
    return http<ReceiptView>(`/sales/${id}/receipt`)
  },

  getWarranty: async (imei: string): Promise<WarrantyLookupView> => {
    return http<WarrantyLookupView>(`/sales/warranty/${imei}`)
  },

  returnSale: async (id: string, dto: ReturnSaleDto): Promise<SaleView> => {
    return http<SaleView>(`/sales/${id}/return`, {
      method: "POST",
      body: dto,
    })
  },
}
