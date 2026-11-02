import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useProfitReport, type ProfitReport } from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"

export type DashboardPeriod = "today" | "week" | "month"

function getPeriodDates(period: DashboardPeriod): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString()
  const start = new Date(now)

  if (period === "today") {
    start.setHours(0, 0, 0, 0)
  } else if (period === "week") {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }

  return { from: start.toISOString(), to }
}

function ProfitMetricCards({ report }: { report: ProfitReport }) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label={t("dashboard.grossProfit")}
        value={`$${Math.round(report.grossProfit).toLocaleString()}`}
        variant="white"
        subtext={`${report.unitsSold} ${t("dashboard.unitsSold")}`}
      />
      <MetricCard
        label={t("dashboard.netOperatingIncome")}
        value={`$${Math.round(report.netOperatingIncome).toLocaleString()}`}
        variant="white"
      />
      <MetricCard
        label={t("dashboard.revenue")}
        value={`$${Math.round(report.revenue).toLocaleString()}`}
        variant="white"
        subtext={`Chakana: $${Math.round(report.byChannel.retail).toLocaleString()} · B2B: $${Math.round(report.byChannel.b2b).toLocaleString()}`}
      />
      <MetricCard
        label={t("dashboard.expenses")}
        value={`$${Math.round(report.expenses).toLocaleString()}`}
        variant="dark"
        subtext={`Qaytarildi: $${Math.round(report.returnsRefunded).toLocaleString()}`}
      />
    </div>
  )
}

export function DashboardMetrics() {
  const { t } = useI18n()
  const [period, setPeriod] = React.useState<DashboardPeriod>("today")
  const { from, to } = React.useMemo(() => getPeriodDates(period), [period])
  const { data: report, isLoading } = useProfitReport(from, to)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs value={period} onValueChange={(val) => setPeriod(val as DashboardPeriod)}>
          <TabsList>
            <TabsTrigger value="today">{t("dashboard.periodToday")}</TabsTrigger>
            <TabsTrigger value="week">{t("dashboard.periodWeek")}</TabsTrigger>
            <TabsTrigger value="month">{t("dashboard.periodMonth")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {report && <ProfitMetricCards report={report} />}
    </div>
  )
}

