import { useI18n } from "@/shared/i18n"
import { formatNumber } from "@/shared/lib/format"
import { useCustomerStats } from "@/entities/customer"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"

export function CustomerSummary() {
  const { t } = useI18n()
  const { data, isLoading } = useCustomerStats()

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
      <MetricCard label={t("customers.statTotal")} value={formatNumber(data.total)} />
      <MetricCard label={t("customers.statNewThisMonth")} value={formatNumber(data.newThisMonth)} />
      <MetricCard label={t("customers.statWithPurchases")} value={formatNumber(data.withPurchases)} />
      <MetricCard
        label={t("customers.statRepeatBuyers")}
        value={formatNumber(data.repeatBuyers)}
        variant="dark"
      />
    </div>
  )
}
