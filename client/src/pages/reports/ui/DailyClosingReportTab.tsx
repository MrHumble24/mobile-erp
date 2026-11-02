import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useDailyClosingReport, type DailyClosingReport } from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

function ClosingCards({ report }: { report: DailyClosingReport }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label={t("dashboard.revenue")}
        value={`$${Math.round(report.revenue).toLocaleString()}`}
        variant="plasma"
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
      />
      <MetricCard
        label="Yangi nasiyalar"
        value={`${report.newConsignments} ta`}
        variant="limestone"
      />
      <MetricCard
        label="Yopilgan nasiyalar"
        value={`${report.settledConsignments} ta`}
        variant="limestone"
      />
    </div>
  )
}

export function DailyClosingReportTab() {
  const { t } = useI18n()
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const { data: report, isLoading } = useDailyClosingReport(date)

  return (
    <div className="space-y-6">
      <div className="w-64 space-y-1">
        <Label>{t("reports.selectDate")}</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {report && <ClosingCards report={report} />}
    </div>
  )
}
