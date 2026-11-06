import { useI18n } from "@/shared/i18n"
import { formatMoney, formatNumber } from "@/shared/lib/format"
import {
  useProfitReport,
  useProfitBreakdown,
  useTrendReport,
  type ProfitReport,
} from "@/entities/report"
import type { BreakdownRequest, BreakdownKind } from "@/features/report-breakdown"
import { MetricCard } from "@/shared/ui/metric-card"
import { Button } from "@/shared/ui/button"
import { TrendChart, BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

interface Tile {
  kind: BreakdownKind
  label: string
  value: string
  subtext?: string
  dark?: boolean
}

function overviewTiles(r: ProfitReport, t: (k: string) => string): Tile[] {
  return [
    { kind: "revenue", label: t("dashboard.revenue"), value: formatMoney(r.revenue), subtext: `${t("dashboard.retail")}: ${formatMoney(r.byChannel.retail)}` },
    { kind: "cogs", label: t("dashboard.cogs"), value: formatMoney(r.cogs) },
    { kind: "grossProfit", label: t("dashboard.grossProfit"), value: formatMoney(r.grossProfit) },
    { kind: "expenses", label: t("dashboard.expenses"), value: formatMoney(r.expenses), dark: true },
    { kind: "noi", label: t("dashboard.netOperatingIncome"), value: formatMoney(r.netOperatingIncome) },
    { kind: "returns", label: t("dashboard.returnsRefunded"), value: formatMoney(r.returnsRefunded) },
    { kind: "units", label: t("dashboard.unitsSold"), value: String(r.unitsSold) },
  ]
}

function TileGrid({
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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {overviewTiles(report, t).map((tile) => (
        <Button
          key={tile.kind}
          type="button"
          variant="ghost"
          className="block h-auto w-full p-0 text-left"
          onClick={() => onBreakdown({ kind: tile.kind, from, to } as BreakdownRequest)}
        >
          <MetricCard
            label={tile.label}
            value={tile.value}
            subtext={tile.subtext}
            variant={tile.dark ? "dark" : "white"}
            className="w-full hover:border-[#6647f0]/40"
          />
        </Button>
      ))}
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
      {profit.data && (
        <TileGrid report={profit.data} from={from} to={to} onBreakdown={onBreakdown} />
      )}
      {profit.data && profit.data.discountsGiven > 0 && (
        <MetricCard
          label={t("pricing.discountsGiven")}
          value={formatMoney(profit.data.discountsGiven)}
          variant="white"
          className="w-full sm:max-w-xs"
        />
      )}
      {profit.data &&
        (profit.data.bonusPointsEarned > 0 || profit.data.bonusPointsSpent > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label={t("reports.pointsEarned")}
              value={formatNumber(profit.data.bonusPointsEarned)}
              variant="white"
            />
            <MetricCard
              label={t("reports.pointsSpent")}
              value={formatNumber(profit.data.bonusPointsSpent)}
              variant="white"
            />
          </div>
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
