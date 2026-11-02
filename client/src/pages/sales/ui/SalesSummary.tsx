import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import { useSalesStats, type SaleFilters } from "@/entities/sale"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"

export function SalesSummary({
  filters,
  canViewProfit,
}: {
  filters: SaleFilters
  canViewProfit: boolean
}) {
  const { t } = useI18n()
  const { data, isLoading } = useSalesStats(filters)

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: canViewProfit ? 5 : 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-[16px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <MetricCard label={t("sales.statsCount")} value={formatNumber(data.count)} />
      <MetricCard label={t("sales.statsRevenue")} value={formatMoney(data.revenue)} />
      <MetricCard label={t("sales.statsAvgPrice")} value={formatMoney(data.avgPrice)} />
      <MetricCard
        label={t("sales.statsReturns")}
        value={formatNumber(data.returnedCount)}
        subtext={`${t("sales.statsRefundTotal")}: ${formatMoney(data.refundTotal)}`}
      />
      {canViewProfit && data.netProfit !== undefined && (
        <MetricCard
          label={t("sales.statsNetProfit")}
          value={formatMoney(data.netProfit)}
          variant="dark"
        />
      )}
    </div>
  )
}
