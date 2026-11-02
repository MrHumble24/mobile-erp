import type {
  BreakdownGroupBy,
  ExpenseGroupBy,
  TrendBucket,
} from "../model/report.types"

export const reportKeys = {
  all: ["reports"] as const,
  profit: (from?: string, to?: string) =>
    [...reportKeys.all, "profit", { from, to }] as const,
  trend: (from?: string, to?: string, bucket?: TrendBucket) =>
    [...reportKeys.all, "trend", { from, to, bucket }] as const,
  profitBreakdown: (groupBy: BreakdownGroupBy, from?: string, to?: string) =>
    [...reportKeys.all, "profit-breakdown", { groupBy, from, to }] as const,
  returns: (from?: string, to?: string, page?: number, pageSize?: number) =>
    [...reportKeys.all, "returns", { from, to, page, pageSize }] as const,
  expenses: (
    from?: string,
    to?: string,
    groupBy?: ExpenseGroupBy,
    categoryId?: string
  ) => [...reportKeys.all, "expenses", { from, to, groupBy, categoryId }] as const,
  consignments: (from?: string, to?: string) =>
    [...reportKeys.all, "consignments", { from, to }] as const,
  inventory: () => [...reportKeys.all, "inventory"] as const,
  modelPricing: (modelId?: string, windowDays?: number) =>
    [...reportKeys.all, "model-pricing", { modelId, windowDays }] as const,
  dailyClosing: (date?: string) =>
    [...reportKeys.all, "daily-closing", date] as const,
  dailyClosingRange: (from?: string, to?: string) =>
    [...reportKeys.all, "daily-closing-range", { from, to }] as const,
}
