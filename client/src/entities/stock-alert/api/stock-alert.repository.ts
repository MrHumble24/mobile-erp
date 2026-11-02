import { http } from "@/shared/api/http"
import type {
  CreateStockAlertRuleDto,
  LowStockView,
  StockAlertRuleView,
  UpdateStockAlertRuleDto,
} from "../model/stock-alert.types"

export const stockAlertRepository = {
  list: async (): Promise<StockAlertRuleView[]> => {
    return http<StockAlertRuleView[]>("/stock-alert-rules")
  },

  lowStock: async (): Promise<LowStockView[]> => {
    return http<LowStockView[]>("/stock-alert-rules/low-stock")
  },

  create: async (
    dto: CreateStockAlertRuleDto
  ): Promise<StockAlertRuleView> => {
    return http<StockAlertRuleView>("/stock-alert-rules", {
      method: "POST",
      body: dto,
    })
  },

  update: async (
    id: string,
    dto: UpdateStockAlertRuleDto
  ): Promise<StockAlertRuleView> => {
    return http<StockAlertRuleView>(`/stock-alert-rules/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },
}
