import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import type { PartnerView } from "@/entities/partner"
import { MetricCard } from "@/shared/ui/metric-card"

/** Tiles derived from the already-fetched (filtered) partner list. */
export function PartnersSummary({ partners }: { partners: PartnerView[] }) {
  const { t } = useI18n()
  const devicesOut = partners.reduce((s, p) => s + p.openCount, 0)
  const overdue = partners.reduce((s, p) => s + p.overdueCount, 0)
  const outstanding = partners.reduce((s, p) => s + Number(p.outstanding), 0)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label={t("partners.statsPartners")} value={formatNumber(partners.length)} />
      <MetricCard label={t("partners.statsDevicesOut")} value={formatNumber(devicesOut)} />
      <MetricCard label={t("partners.statsOutstanding")} value={formatMoney(outstanding)} />
      <MetricCard
        label={t("partners.statsOverdue")}
        value={formatNumber(overdue)}
        variant={overdue > 0 ? "dark" : "white"}
      />
    </div>
  )
}
