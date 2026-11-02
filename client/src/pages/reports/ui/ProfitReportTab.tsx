import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useProfitReport, type ProfitReport } from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

function ProfitReportCards({ report }: { report: ProfitReport }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label={t("dashboard.revenue")}
        value={`$${Math.round(report.revenue).toLocaleString()}`}
        variant="plasma"
        subtext={`Chakana: $${Math.round(report.byChannel.retail).toLocaleString()} · B2B: $${Math.round(report.byChannel.b2b).toLocaleString()}`}
      />
      <MetricCard
        label={t("dashboard.cogs")}
        value={`$${Math.round(report.cogs).toLocaleString()}`}
        variant="dark"
        subtext={`${report.unitsSold} ${t("dashboard.unitsSold")}`}
      />
      <MetricCard
        label={t("dashboard.grossProfit")}
        value={`$${Math.round(report.grossProfit).toLocaleString()}`}
        variant="ember"
      />
      <MetricCard
        label={t("dashboard.expenses")}
        value={`$${Math.round(report.expenses).toLocaleString()}`}
        variant="dark"
        subtext={`Qaytarildi: $${Math.round(report.returnsRefunded).toLocaleString()}`}
      />
      <MetricCard
        label={t("dashboard.netOperatingIncome")}
        value={`$${Math.round(report.netOperatingIncome).toLocaleString()}`}
        variant="limestone"
      />
    </div>
  )
}

export function ProfitReportTab() {
  const { t } = useI18n()
  const [from, setFrom] = React.useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = React.useState(() => new Date().toISOString().slice(0, 10))

  const { data: report, isLoading } = useProfitReport(
    from ? new Date(from).toISOString() : undefined,
    to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <Label>{t("reports.dateFrom")}</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1">
          <Label>{t("reports.dateTo")}</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {report && <ProfitReportCards report={report} />}
    </div>
  )
}
