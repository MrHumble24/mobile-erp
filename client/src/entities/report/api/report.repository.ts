import { http } from "@/shared/api/http"
import type {
  BreakdownGroupBy,
  BreakdownRow,
  ConsignmentsReport,
  DailyClosingReport,
  ExpenseGroupBy,
  ExpenseReportRow,
  InventoryReport,
  ModelPricingRow,
  ProfitReport,
  ReturnsPage,
  TrendBucket,
  TrendPoint,
} from "../model/report.types"

export const reportRepository = {
  profit: (from?: string, to?: string) =>
    http<ProfitReport>("/reports/profit", { params: { from, to } }),

  trend: (from?: string, to?: string, bucket: TrendBucket = "day") =>
    http<TrendPoint[]>("/reports/trend", { params: { from, to, bucket } }),

  profitBreakdown: (
    groupBy: BreakdownGroupBy,
    from?: string,
    to?: string
  ) =>
    http<BreakdownRow[]>("/reports/profit/breakdown", {
      params: { from, to, groupBy },
    }),

  returns: (from?: string, to?: string, page = 1, pageSize = 50) =>
    http<ReturnsPage>("/reports/returns", {
      params: { from, to, page, pageSize },
    }),

  expenses: (
    from?: string,
    to?: string,
    groupBy: ExpenseGroupBy = "category",
    categoryId?: string
  ) =>
    http<ExpenseReportRow[]>("/reports/expenses", {
      params: { from, to, groupBy, categoryId },
    }),

  consignments: (from?: string, to?: string) =>
    http<ConsignmentsReport>("/reports/consignments", {
      params: { from, to },
    }),

  inventory: () => http<InventoryReport>("/reports/inventory"),

  modelPricing: (modelId?: string, windowDays = 90) =>
    http<ModelPricingRow[]>("/reports/model-pricing", {
      params: { modelId, windowDays },
    }),

  dailyClosing: (date?: string) =>
    http<DailyClosingReport>("/reports/daily-closing", { params: { date } }),

  dailyClosingRange: (from?: string, to?: string) =>
    http<DailyClosingReport[]>("/reports/daily-closing/range", {
      params: { from, to },
    }),
}
