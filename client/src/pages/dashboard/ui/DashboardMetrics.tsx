import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useProfitReport, type ProfitReport } from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"

const DASHBOARD_PERIODS = ["today", "week", "month"] as const
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]

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
        value={formatMoney(report.grossProfit)}
        variant="white"
        subtext={`${report.unitsSold} ${t("dashboard.unitsSold")}`}
      />
      <MetricCard
        label={t("dashboard.netOperatingIncome")}
        value={formatMoney(report.netOperatingIncome)}
        variant="white"
      />
      <MetricCard
        label={t("dashboard.revenue")}
        value={formatMoney(report.revenue)}
        variant="white"
        subtext={`${t("dashboard.retail")}: ${formatMoney(report.byChannel.retail)} · B2B: ${formatMoney(report.byChannel.b2b)}`}
      />
      <MetricCard
        label={t("dashboard.expenses")}
        value={formatMoney(report.expenses)}
        variant="dark"
        subtext={`${t("dashboard.returnsRefunded")}: ${formatMoney(report.returnsRefunded)}`}
      />
    </div>
  )
}

export function DashboardMetrics() {
  const { t } = useI18n()
  const [period, setPeriod] = useUrlTab<DashboardPeriod>("today", {
    paramKey: "period",
    validTabs: DASHBOARD_PERIODS,
  })
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

