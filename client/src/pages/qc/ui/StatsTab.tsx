import { useI18n } from "@/shared/i18n"
import { useQcStats, type QcStatsView } from "@/entities/qc"
import { MetricCard } from "@/shared/ui/metric-card"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { useStatsRange, STATS_PRESETS, type StatsPreset } from "../model/use-stats-range"

function RangePicker({ range }: { range: ReturnType<typeof useStatsRange> }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATS_PRESETS.map((p: StatsPreset) => (
        <Button
          key={p}
          size="sm"
          variant={range.preset === p ? "default" : "outline"}
          onClick={() => range.setPreset(p)}
        >
          {t(`qc.preset_${p}`)}
        </Button>
      ))}
      {range.preset === "custom" && (
        <>
          <Input type="date" className="h-8 w-auto" value={range.customFrom} onChange={(e) => range.setCustomFrom(e.target.value)} />
          <Input type="date" className="h-8 w-auto" value={range.customTo} onChange={(e) => range.setCustomTo(e.target.value)} />
        </>
      )}
    </div>
  )
}

function StatsCards({ stats }: { stats: QcStatsView }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard value={stats.inspected} label={t("qc.statInspected")} />
      <MetricCard value={`${Math.round(stats.passRate * 100)}%`} label={t("qc.statPassRate")} />
      <MetricCard value={stats.failed} label={t("qc.statFailed")} />
      <MetricCard value={stats.awaitingInspection} label={t("qc.awaitingInspection")} />
      <MetricCard value={stats.avgBatteryHealth != null ? `${stats.avgBatteryHealth}%` : "-"} label={t("qc.statAvgBattery")} />
    </div>
  )
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[#eeeeee] overflow-hidden">
        <div className="h-full bg-[#0091ff]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { key: string; label: string; count: number }[] }) {
  const { t } = useI18n()
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)] space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.notFound")}</p>
      ) : (
        rows.map((r) => <Bar key={r.key} label={r.label} count={r.count} max={max} />)
      )}
    </div>
  )
}

export function StatsTab() {
  const { t } = useI18n()
  const range = useStatsRange()
  const { data: stats, isLoading } = useQcStats(range.range)

  if (isLoading || !stats) {
    return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
  }

  return (
    <div className="space-y-5">
      <RangePicker range={range} />
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Breakdown
          title={t("qc.byGrade")}
          rows={stats.byGrade.map((g) => ({ key: g.gradeCode, label: g.gradeCode, count: g.count }))}
        />
        <Breakdown
          title={t("qc.topDefects")}
          rows={stats.topDefects.map((d) => ({ key: d.defectCode, label: d.label, count: d.count }))}
        />
      </div>
    </div>
  )
}
