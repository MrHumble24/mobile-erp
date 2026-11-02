import { useQuery } from "@tanstack/react-query"
import { reportRepository } from "../api/report.repository"
import { reportKeys } from "../api/report.keys"
import type {
  BreakdownGroupBy,
  ExpenseGroupBy,
  TrendBucket,
} from "./report.types"

export function useProfitReport(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.profit(from, to),
    queryFn: () => reportRepository.profit(from, to),
  })
}

export function useTrendReport(
  from?: string,
  to?: string,
  bucket: TrendBucket = "day"
) {
  return useQuery({
    queryKey: reportKeys.trend(from, to, bucket),
    queryFn: () => reportRepository.trend(from, to, bucket),
  })
}

export function useProfitBreakdown(
  groupBy: BreakdownGroupBy,
  from?: string,
  to?: string
) {
  return useQuery({
    queryKey: reportKeys.profitBreakdown(groupBy, from, to),
    queryFn: () => reportRepository.profitBreakdown(groupBy, from, to),
  })
}

export function useReturnsReport(
  from?: string,
  to?: string,
  page = 1,
  pageSize = 50
) {
  return useQuery({
    queryKey: reportKeys.returns(from, to, page, pageSize),
    queryFn: () => reportRepository.returns(from, to, page, pageSize),
  })
}

export function useExpenseReport(
  from?: string,
  to?: string,
  groupBy: ExpenseGroupBy = "category",
  categoryId?: string
) {
  return useQuery({
    queryKey: reportKeys.expenses(from, to, groupBy, categoryId),
    queryFn: () => reportRepository.expenses(from, to, groupBy, categoryId),
  })
}

export function useConsignmentsReport(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.consignments(from, to),
    queryFn: () => reportRepository.consignments(from, to),
  })
}

export function useInventoryReport() {
  return useQuery({
    queryKey: reportKeys.inventory(),
    queryFn: () => reportRepository.inventory(),
  })
}

export function useModelPricingReport(modelId?: string, windowDays = 90) {
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

export function useDailyClosingRange(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.dailyClosingRange(from, to),
    queryFn: () => reportRepository.dailyClosingRange(from, to),
  })
}
