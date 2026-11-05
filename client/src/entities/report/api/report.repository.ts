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

const allHeaders = (all?: boolean) =>
  all ? { "X-Store-Id": "all" } : undefined

export const reportRepository = {
  profit: (from?: string, to?: string, allStores?: boolean) =>
    http<ProfitReport>("/reports/profit", {
      params: { from, to },
      headers: allHeaders(allStores),
    }),

  trend: (
    from?: string,
    to?: string,
    bucket: TrendBucket = "day",
    allStores?: boolean
  ) =>
    http<TrendPoint[]>("/reports/trend", {
      params: { from, to, bucket },
      headers: allHeaders(allStores),
    }),

  profitBreakdown: (
    groupBy: BreakdownGroupBy,
    from?: string,
    to?: string,
    allStores?: boolean
  ) =>
    http<BreakdownRow[]>("/reports/profit/breakdown", {
      params: { from, to, groupBy },
      headers: allHeaders(allStores),
    }),

  returns: (
    from?: string,
    to?: string,
    page = 1,
    pageSize = 50,
    allStores?: boolean
  ) =>
    http<ReturnsPage>("/reports/returns", {
      params: { from, to, page, pageSize },
      headers: allHeaders(allStores),
    }),

  expenses: (
    from?: string,
    to?: string,
    groupBy: ExpenseGroupBy = "category",
    categoryId?: string,
    allStores?: boolean
  ) =>
    http<ExpenseReportRow[]>("/reports/expenses", {
      params: { from, to, groupBy, categoryId },
      headers: allHeaders(allStores),
    }),

  consignments: (from?: string, to?: string, allStores?: boolean) =>
    http<ConsignmentsReport>("/reports/consignments", {
      params: { from, to },
      headers: allHeaders(allStores),
    }),

  inventory: (allStores?: boolean) =>
    http<InventoryReport>("/reports/inventory", {
      headers: allHeaders(allStores),
    }),

  modelPricing: (modelId?: string, windowDays = 90, allStores?: boolean) =>
    http<ModelPricingRow[]>("/reports/model-pricing", {
      params: { modelId, windowDays },
      headers: allHeaders(allStores),
    }),

  dailyClosing: (date?: string, allStores?: boolean) =>
    http<DailyClosingReport>("/reports/daily-closing", {
      params: { date },
      headers: allHeaders(allStores),
    }),

  dailyClosingRange: (from?: string, to?: string, allStores?: boolean) =>
    http<DailyClosingReport[]>("/reports/daily-closing/range", {
      params: { from, to },
      headers: allHeaders(allStores),
    }),
}
