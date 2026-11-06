import { useQuery } from "@tanstack/react-query"
import { reportRepository } from "../api/report.repository"
import { reportKeys } from "../api/report.keys"
import { useReportAllStores } from "./report-store-context"
import type {
  BreakdownGroupBy,
  ExpenseGroupBy,
  TrendBucket,
} from "./report.types"

export function useProfitReport(from?: string, to?: string) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.profit(from, to), allStores],
    queryFn: () => reportRepository.profit(from, to, allStores),
  })
}

export function useTrendReport(
  from?: string,
  to?: string,
  bucket: TrendBucket = "day"
) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.trend(from, to, bucket), allStores],
    queryFn: () => reportRepository.trend(from, to, bucket, allStores),
  })
}

export function useProfitBreakdown(
  groupBy: BreakdownGroupBy,
  from?: string,
  to?: string
) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.profitBreakdown(groupBy, from, to), allStores],
    queryFn: () => reportRepository.profitBreakdown(groupBy, from, to, allStores),
  })
}

export function useReturnsReport(
  from?: string,
  to?: string,
  page = 1,
  pageSize = 50
) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.returns(from, to, page, pageSize), allStores],
    queryFn: () => reportRepository.returns(from, to, page, pageSize, allStores),
  })
}

export function useExpenseReport(
  from?: string,
  to?: string,
  groupBy: ExpenseGroupBy = "category",
  categoryId?: string
) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.expenses(from, to, groupBy, categoryId), allStores],
    queryFn: () => reportRepository.expenses(from, to, groupBy, categoryId, allStores),
  })
}

export function useConsignmentsReport(from?: string, to?: string) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.consignments(from, to), allStores],
    queryFn: () => reportRepository.consignments(from, to, allStores),
  })
}

export function useInventoryReport() {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.inventory(), allStores],
    queryFn: () => reportRepository.inventory(allStores),
  })
}

export function useModelPricingReport(modelId?: string, windowDays = 90) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.modelPricing(modelId, windowDays), allStores],
    queryFn: () => reportRepository.modelPricing(modelId, windowDays, allStores),
  })
}

export function useDailyClosingReport(date?: string) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.dailyClosing(date), allStores],
    queryFn: () => reportRepository.dailyClosing(date, allStores),
    enabled: Boolean(date),
  })
}

export function useDailyClosingRange(from?: string, to?: string) {
  const allStores = useReportAllStores()
  return useQuery({
    queryKey: [...reportKeys.dailyClosingRange(from, to), allStores],
    queryFn: () => reportRepository.dailyClosingRange(from, to, allStores),
  })
}
