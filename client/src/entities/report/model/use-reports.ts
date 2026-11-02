import { useQuery } from "@tanstack/react-query"
import { reportRepository } from "../api/report.repository"
import { reportKeys } from "../api/report.keys"

export function useProfitReport(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.profit(from, to),
    queryFn: () => reportRepository.profit(from, to),
  })
}

export function useExpenseReport(
  from?: string,
  to?: string,
  groupBy: "category" | "month" = "category"
) {
  return useQuery({
    queryKey: reportKeys.expenses(from, to, groupBy),
    queryFn: () => reportRepository.expenses(from, to, groupBy),
  })
}

export function useModelPricingReport(modelId?: string, windowDays: number = 90) {
  return useQuery({
    queryKey: reportKeys.modelPricing(modelId, windowDays),
    queryFn: () => reportRepository.modelPricing(modelId, windowDays),
  })
}

export function useDailyClosingReport(date?: string) {
  return useQuery({
    queryKey: reportKeys.dailyClosing(date),
    queryFn: () => reportRepository.dailyClosing(date),
    enabled: Boolean(date),
  })
}
