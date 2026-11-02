import { http } from "@/shared/api/http"
import type {
  CreateSaleDto,
  ReceiptView,
  ReturnSaleDto,
  SaleFilters,
  SalePage,
  SaleView,
  WarrantyLookupView,
} from "../model/sale.types"

export const saleRepository = {
  create: async (dto: CreateSaleDto): Promise<SaleView> => {
    return http<SaleView>("/sales", {
      method: "POST",
      body: dto,
    })
  },

  list: async (filters?: SaleFilters): Promise<SalePage> => {
    return http<SalePage>("/sales", {
      params: filters as Record<string, string | number | boolean | undefined | null>,
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

  returnSale: async (id: string, dto: ReturnSaleDto): Promise<{ success: boolean }> => {
    return http<{ success: boolean }>(`/sales/${id}/return`, {
      method: "POST",
      body: dto,
    })
  },
}
