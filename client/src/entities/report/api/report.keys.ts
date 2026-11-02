export const reportKeys = {
  all: ["reports"] as const,
  profit: (from?: string, to?: string) =>
    [...reportKeys.all, "profit", { from, to }] as const,
  expenses: (from?: string, to?: string, groupBy?: "category" | "month") =>
    [...reportKeys.all, "expenses", { from, to, groupBy }] as const,
  modelPricing: (modelId?: string, windowDays?: number) =>
    [...reportKeys.all, "model-pricing", { modelId, windowDays }] as const,
  dailyClosing: (date?: string) =>
    [...reportKeys.all, "daily-closing", date] as const,
}
