import { http } from "@/shared/api/http"
import type {
  DailyClosingReport,
  ExpenseReportRow,
  ModelPricingRow,
  ProfitReport,
} from "../model/report.types"

export const reportRepository = {
  profit: async (from?: string, to?: string): Promise<ProfitReport> => {
    return http<ProfitReport>("/reports/profit", {
      params: { from, to },
    })
  },

  expenses: async (
    from?: string,
    to?: string,
    groupBy: "category" | "month" = "category"
  ): Promise<ExpenseReportRow[]> => {
    return http<ExpenseReportRow[]>("/reports/expenses", {
      params: { from, to, groupBy },
    })
  },

  modelPricing: async (
    modelId?: string,
    windowDays: number = 90
  ): Promise<ModelPricingRow[]> => {
    return http<ModelPricingRow[]>("/reports/model-pricing", {
      params: { modelId, windowDays },
    })
  },

  dailyClosing: async (date?: string): Promise<DailyClosingReport> => {
    return http<DailyClosingReport>("/reports/daily-closing", {
      params: { date },
    })
  },
}
