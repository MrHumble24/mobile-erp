import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import {
  useProfitReport,
  useProfitBreakdown,
  useTrendReport,
} from "@/entities/report"
import { Skeleton } from "@/shared/ui/skeleton"
import { TrendChart, BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"
import { ExecutiveMetrics } from "./ExecutiveMetrics"

export function OverviewTab({ range, onBreakdown }: ReportTabProps) {
  const { t } = useI18n()
  const { from, to, bucket } = range
  const profit = useProfitReport(from, to)
  const trend = useTrendReport(from, to, bucket)
  const channel = useProfitBreakdown("channel", from, to)

  const channelRows = (channel.data ?? []).map((c) => ({
    key: c.key,
    label: c.label,
    value: c.revenue,
    share: c.share,
  }))

  return (
    <div className="space-y-6">
      {profit.isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[16px]" />
          ))}
        </div>
      )}

      {profit.data && (
        <ExecutiveMetrics
          report={profit.data}
          from={from}
          to={to}
          onBreakdown={onBreakdown}
        />
      )}

      <TrendChart
        title={t("reports.trendTitle")}
        data={trend.data ?? []}
        isLoading={trend.isLoading}
        error={trend.error}
      />

      <BreakdownBarChart
        title={t("reports.channelSplit")}
        rows={channelRows}
        labelHeader={t("reports.channel")}
        valueHeader={t("dashboard.revenue")}
        formatValue={formatMoney}
        isLoading={channel.isLoading}
        error={channel.error}
        csvFilename="channel-split"
      />
    </div>
  )
}
