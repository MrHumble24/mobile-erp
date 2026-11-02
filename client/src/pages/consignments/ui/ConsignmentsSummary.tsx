import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import { useConsignmentStats, type ConsignmentFilters } from "@/entities/consignment"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"

export function ConsignmentsSummary({ filters }: { filters: ConsignmentFilters }) {
  const { t } = useI18n()
  const { data, isLoading } = useConsignmentStats(filters)

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-[16px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label={t("consignments.statsTotal")} value={formatNumber(data.total)} />
      <MetricCard label={t("consignments.statsOpen")} value={formatNumber(data.openCount)} />
      <MetricCard label={t("consignments.statsOutstanding")} value={formatMoney(data.outstanding)} />
      <MetricCard
        label={t("consignments.statsOverdue")}
        value={formatNumber(data.overdueCount)}
        variant={data.overdueCount > 0 ? "dark" : "white"}
      />
    </div>
  )
}
