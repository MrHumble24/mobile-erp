import { useI18n } from "@/shared/i18n"
import { formatNumber } from "@/shared/lib/format"
import { useUserStats, useRoles } from "@/entities/user"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"

export function UsersSummary() {
  const { t } = useI18n()
  const { data, isLoading } = useUserStats()
  const { data: roles } = useRoles()

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-[16px]" />
        ))}
      </div>
    )
  }

  const roleName = (code: string) => roles?.find((r) => r.code === code)?.name ?? code
  const byRole = Object.entries(data.byRole).sort((a, b) => b[1] - a[1])

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label={t("users.statTotal")} value={formatNumber(data.total)} />
      <MetricCard
        label={t("users.statActive")}
        value={formatNumber(data.active)}
        subtext={`${t("users.statInactive")}: ${formatNumber(data.total - data.active)}`}
        variant="dark"
      />
      {byRole.slice(0, 2).map(([code, count]) => (
        <MetricCard key={code} label={roleName(code)} value={formatNumber(count)} />
      ))}
    </div>
  )
}
