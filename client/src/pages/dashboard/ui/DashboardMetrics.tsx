import * as React from "react"
import {
  TrendingUp,
  Receipt,
  Smartphone,
  Coins,
  Sparkles,
} from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import { useProfitReport, useTrendReport, type ProfitReport } from "@/entities/report"
import { Skeleton } from "@/shared/ui/skeleton"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { DashboardSalesChart } from "./DashboardSalesChart"

const DASHBOARD_PERIODS = ["today", "week", "month"] as const
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]

function getPeriodDates(period: DashboardPeriod): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString()
  const start = new Date(now)

  if (period === "today") {
    start.setHours(0, 0, 0, 0)
  } else if (period === "week") {
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }

  return { from: start.toISOString(), to }
}

function ExecutiveDashboardCards({ report }: { report: ProfitReport }) {
  const { t } = useI18n()

  const marginPct = report.revenue > 0 ? (report.grossProfit / report.revenue) * 100 : 0
  const expensePct = report.revenue > 0 ? (report.expenses / report.revenue) * 100 : 0
  const netMarginPct = report.revenue > 0 ? (report.netOperatingIncome / report.revenue) * 100 : 0
  const avgCheck = report.unitsSold > 0 ? report.revenue / report.unitsSold : 0

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Tushum */}
      <div className="relative flex flex-col justify-between rounded-[20px] border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.revenue")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="font-mono text-2xl font-black tracking-tight text-foreground">
            {formatMoney(report.revenue)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("dashboard.retail")}: {formatMoney(report.byChannel.retail)}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
          Jami savdo aylanmasi
        </div>
      </div>

      {/* 2. Yalpi foyda */}
      <div className="relative flex flex-col justify-between rounded-[20px] border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.grossProfit")}
          </span>
          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-400">
            +{marginPct.toFixed(1)}% {t("dashboard.marginPct")}
          </span>
        </div>
        <div className="my-2">
          <div className="font-mono text-2xl font-black tracking-tight text-sky-400">
            {formatMoney(report.grossProfit)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("dashboard.revenue")} − {t("dashboard.cogs")}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
          Tovar sotishdan olingan foyda
        </div>
      </div>

      {/* 3. Operatsion xarajatlar */}
      <div className="relative flex flex-col justify-between rounded-[20px] border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.expenses")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <Receipt className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="font-mono text-2xl font-black tracking-tight text-rose-400">
            {formatMoney(report.expenses)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            tushumning {expensePct.toFixed(1)}% qismi
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
          Do'kon va xodimlar xarajatlari
        </div>
      </div>

      {/* 4. Sof foyda */}
      <div
        className={`relative flex flex-col justify-between rounded-[20px] border p-4 sm:p-5 shadow-[var(--shadow-xs)] ${
          report.netOperatingIncome >= 0
            ? "border-emerald-500/40 bg-emerald-950/15"
            : "border-rose-500/40 bg-rose-950/15"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.netOperatingIncome")}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
              report.netOperatingIncome >= 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            }`}
          >
            <Sparkles className="size-3" />
            {netMarginPct.toFixed(1)}%
          </span>
        </div>
        <div className="my-2">
          <div
            className={`font-mono text-2xl font-black tracking-tight ${
              report.netOperatingIncome >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatMoney(report.netOperatingIncome)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("dashboard.grossProfit")} − {t("dashboard.expenses")}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
          Barcha xarajatlardan so'ng qolgan foyda
        </div>
      </div>

      {/* 5. Sotilgan qurilmalar */}
      <div className="relative flex flex-col justify-between rounded-[20px] border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.unitsSold")}
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <div className="font-mono text-2xl font-black tracking-tight text-foreground">
            {formatNumber(report.unitsSold)}{" "}
            <span className="text-sm font-normal text-muted-foreground">dona</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("dashboard.avgCheck")}: {formatMoney(avgCheck)}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/40">
          Mijozlarga topshirilgan tovarlar
        </div>
      </div>
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
  const { data: report, isLoading: reportLoading } = useProfitReport(from, to)
  const { data: trendData, isLoading: trendLoading } = useTrendReport(from, to, "day")

  return (
    <div className="space-y-5">
      {/* Period Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="size-5 text-primary" />
          <h3 className="text-base font-bold text-foreground tracking-tight">
            Asosiy ko'rsatkichlar
          </h3>
        </div>

        {/* Quick Period Buttons */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border">
          {DASHBOARD_PERIODS.map((p) => {
            const isActive = period === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`dashboard.period_${p}` as any) ||
                  (p === "today"
                    ? t("dashboard.periodToday")
                    : p === "week"
                      ? t("dashboard.periodWeek")
                      : t("dashboard.periodMonth"))}
              </button>
            )
          })}
        </div>
      </div>

      {/* KPI Cards */}
      {reportLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[20px]" />
          ))}
        </div>
      ) : report ? (
        <ExecutiveDashboardCards report={report} />
      ) : null}

      {/* Apache ECharts Dynamic Sales & Profit Trend */}
      <DashboardSalesChart data={trendData ?? []} isLoading={trendLoading} />
    </div>
  )
}
