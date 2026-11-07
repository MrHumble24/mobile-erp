import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useRepairReport, RepairLoadError } from "@/entities/repair"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"
import type { ReportRange } from "../model/use-report-range"

/** Repair finance over the selected range (ADR 0040). Income always; parts
 *  cost / outside cost / profit only when the server returns them (the caller
 *  has `device.cost.view`). A failed query is named, never a blank tab. */
export function RepairsReportTab({ range }: { range: ReportRange }) {
  const { t } = useI18n()
  const { data, isLoading, isError, refetch } = useRepairReport({ from: range.from, to: range.to })

  if (isLoading) return <Skeleton className="h-40 rounded-[16px]" />
  if (isError || !data) return <RepairLoadError onRetry={() => void refetch()} compact />

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard label={t("repairs.reportIncome")} value={formatMoney(data.income)} variant="dark" />
      {data.partsCost != null && (
        <MetricCard label={t("repairs.reportPartsCost")} value={formatMoney(data.partsCost)} variant="white" />
      )}
      {data.outsideCost != null && (
        <MetricCard label={t("repairs.reportOutsideCost")} value={formatMoney(data.outsideCost)} variant="white" />
      )}
      {data.profit != null && (
        <MetricCard label={t("repairs.reportProfit")} value={formatMoney(data.profit)} variant="white" />
      )}
    </div>
  )
}
