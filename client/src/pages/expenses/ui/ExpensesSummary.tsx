import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import { useExpenseSummary } from "@/entities/expense"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"

function deltaLabel(total: number, previous: number): string {
  if (previous <= 0) return "—"
  const pct = ((total - previous) / previous) * 100
  const sign = pct > 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}%`
}

export function ExpensesSummary({ from, to }: { from?: string; to?: string }) {
  const { t } = useI18n()
  const { data, isLoading } = useExpenseSummary({ from, to })

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
      <MetricCard
        label={t("expenses.metricTotal")}
        value={formatMoney(data.total)}
        variant="dark"
      />
      <MetricCard
        label={t("expenses.metricVsPrevious")}
        value={deltaLabel(data.total, data.previousTotal)}
        subtext={formatMoney(data.previousTotal)}
      />
      <MetricCard
        label={t("expenses.metricTopCategory")}
        value={data.topCategory?.name ?? "—"}
        subtext={data.topCategory ? formatMoney(data.topCategory.total) : undefined}
      />
      <MetricCard
        label={t("expenses.metricCount")}
        value={formatNumber(data.count)}
      />
    </div>
  )
}
