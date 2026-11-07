import {
  TrendingUp,
  Receipt,
  Smartphone,
  HelpCircle,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Tag,
  Award,
} from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import {
  useProfitReport,
  useProfitBreakdown,
  useTrendReport,
  type ProfitReport,
} from "@/entities/report"
import type { BreakdownRequest } from "@/features/report-breakdown"
import { Skeleton } from "@/shared/ui/skeleton"
import { TrendChart, BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

function ExecutiveMetrics({
  report,
  onBreakdown,
  from,
  to,
}: {
  report: ProfitReport
  onBreakdown: ReportTabProps["onBreakdown"]
  from: string
  to: string
}) {
  const { t } = useI18n()

  const marginPct = report.revenue > 0 ? (report.grossProfit / report.revenue) * 100 : 0
  const expensePct = report.revenue > 0 ? (report.expenses / report.revenue) * 100 : 0
  const netMarginPct = report.revenue > 0 ? (report.netOperatingIncome / report.revenue) * 100 : 0
  const avgCheck = report.unitsSold > 0 ? report.revenue / report.unitsSold : 0

  return (
    <div className="space-y-4">
      {/* Primary Hero 5-Card Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* 1. Tushum */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "revenue", from, to } as BreakdownRequest)}
          className="group relative flex flex-col justify-between rounded-[16px] border border-border bg-card p-4 text-left shadow-[var(--shadow-xs)] transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">
              {t("dashboard.revenue")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {formatMoney(report.revenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("dashboard.retail")}: {formatMoney(report.byChannel.retail)}
            </div>
          </div>
          <div className="flex items-center text-[11px] font-medium text-primary/80 group-hover:text-primary">
            <span>{t("reports.clickToInspect")}</span>
            <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* 2. Yalpi foyda (Gross Profit) */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "grossProfit", from, to } as BreakdownRequest)}
          className="group relative flex flex-col justify-between rounded-[16px] border border-border bg-card p-4 text-left shadow-[var(--shadow-xs)] transition-all hover:border-sky-500/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">
              {t("dashboard.grossProfit")}
            </span>
            <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-400">
              +{marginPct.toFixed(1)}% {t("reports.marginPct")}
            </span>
          </div>
          <div className="my-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-sky-400">
              {formatMoney(report.grossProfit)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("dashboard.revenue")} − {t("dashboard.cogs")}
            </div>
          </div>
          <div className="flex items-center text-[11px] font-medium text-sky-400/80 group-hover:text-sky-400">
            <span>{t("reports.clickToInspect")}</span>
            <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* 3. Xarajatlar */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "expenses", from, to } as BreakdownRequest)}
          className="group relative flex flex-col justify-between rounded-[16px] border border-border bg-card p-4 text-left shadow-[var(--shadow-xs)] transition-all hover:border-rose-500/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">
              {t("dashboard.expenses")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Receipt className="size-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-rose-400">
              {formatMoney(report.expenses)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("reports.pctOfRevenue", { pct: expensePct.toFixed(1) })}
            </div>
          </div>
          <div className="flex items-center text-[11px] font-medium text-rose-400/80 group-hover:text-rose-400">
            <span>{t("reports.clickToInspect")}</span>
            <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* 4. Sof operatsion foyda (Net Income) */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "noi", from, to } as BreakdownRequest)}
          className={`group relative flex flex-col justify-between rounded-[16px] border p-4 text-left shadow-[var(--shadow-xs)] transition-all hover:shadow-md cursor-pointer ${
            report.netOperatingIncome >= 0
              ? "border-emerald-500/40 bg-emerald-950/15 hover:border-emerald-500/80"
              : "border-rose-500/40 bg-rose-950/15 hover:border-rose-500/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">
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
              className={`font-mono text-2xl font-bold tracking-tight ${
                report.netOperatingIncome >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatMoney(report.netOperatingIncome)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("dashboard.grossProfit")} − {t("dashboard.expenses")}
            </div>
          </div>
          <div
            className={`flex items-center text-[11px] font-medium ${
              report.netOperatingIncome >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span>{t("reports.clickToInspect")}</span>
            <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* 5. Sotilgan telefonlar */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "units", from, to } as BreakdownRequest)}
          className="group relative flex flex-col justify-between rounded-[16px] border border-border bg-card p-4 text-left shadow-[var(--shadow-xs)] transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">
              {t("dashboard.unitsSold")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="size-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(report.unitsSold)}{" "}
              <span className="text-sm font-normal text-muted-foreground">{t("reports.units")}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {t("reports.avgCheck")}: {formatMoney(avgCheck)}
            </div>
          </div>
          <div className="flex items-center text-[11px] font-medium text-primary/80 group-hover:text-primary">
            <span>{t("reports.clickToInspect")}</span>
            <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>

      {/* Explainer Ribbon (Friendly no-rocket-science guidance) */}
      <div className="flex items-center gap-2 rounded-[12px] border border-border/60 bg-card/60 px-3.5 py-2.5 text-xs text-muted-foreground">
        <HelpCircle className="size-4 shrink-0 text-primary" />
        <span>{t("reports.formulaExplainer")}</span>
      </div>

      {/* Secondary Details: COGS, Returns, Discounts, Bonus points */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* COGS / Tannarx */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "cogs", from, to } as BreakdownRequest)}
          className="flex items-center justify-between rounded-[12px] border border-border bg-card/70 px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 cursor-pointer"
        >
          <div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-muted-foreground" />
              <span>{t("dashboard.cogs")}</span>
            </div>
            <div className="font-mono text-sm font-bold text-foreground mt-0.5">
              {formatMoney(report.cogs)}
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
        </button>

        {/* Returns */}
        <button
          type="button"
          onClick={() => onBreakdown({ kind: "returns", from, to } as BreakdownRequest)}
          className="flex items-center justify-between rounded-[12px] border border-border bg-card/70 px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 cursor-pointer"
        >
          <div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <RotateCcw className="size-3.5 text-muted-foreground" />
              <span>{t("dashboard.returnsRefunded")}</span>
            </div>
            <div className="font-mono text-sm font-bold text-foreground mt-0.5">
              {formatMoney(report.returnsRefunded)}
            </div>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
        </button>

        {/* Discounts */}
        <div className="flex items-center justify-between rounded-[12px] border border-border bg-card/70 px-3.5 py-2.5">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="size-3.5 text-amber-500" />
              <span>{t("pricing.discountsGiven")}</span>
            </div>
            <div className="font-mono text-sm font-bold text-foreground mt-0.5">
              {formatMoney(report.discountsGiven)}
            </div>
          </div>
        </div>

        {/* Bonus Points */}
        <div className="flex items-center justify-between rounded-[12px] border border-border bg-card/70 px-3.5 py-2.5">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Award className="size-3.5 text-sky-400" />
              <span>{t("reports.pointsEarned")} / {t("reports.pointsSpent")}</span>
            </div>
            <div className="font-mono text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-400">+{formatNumber(report.bonusPointsEarned)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-rose-400">-{formatNumber(report.bonusPointsSpent)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OverviewTab({ range, onBreakdown }: ReportTabProps) {
  const { t } = useI18n()
  const { from, to, bucket } = range
  const profit = useProfitReport(from, to)
  const trend = useTrendReport(from, to, bucket)
  const channel = useProfitBreakdown("channel", from, to)

  const channelRows = (channel.data ?? []).map((c) => ({
    key: c.key,
    label: c.label,
    value: c.revenue,
    share: c.share,
  }))

  return (
    <div className="space-y-6">
      {profit.isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[16px]" />
          ))}
        </div>
      )}

      {profit.data && (
        <ExecutiveMetrics
          report={profit.data}
          from={from}
          to={to}
          onBreakdown={onBreakdown}
        />
      )}

      <TrendChart
        title={t("reports.trendTitle")}
        data={trend.data ?? []}
        isLoading={trend.isLoading}
        error={trend.error}
      />

      <BreakdownBarChart
        title={t("reports.channelSplit")}
        rows={channelRows}
        labelHeader={t("reports.channel")}
        valueHeader={t("dashboard.revenue")}
        formatValue={formatMoney}
        isLoading={channel.isLoading}
        error={channel.error}
        csvFilename="channel-split"
      />
    </div>
  )
}
