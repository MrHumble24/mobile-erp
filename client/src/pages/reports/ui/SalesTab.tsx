import * as React from "react"
import { Smartphone, Store, User, Calendar } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useProfitBreakdown, type BreakdownGroupBy } from "@/entities/report"
import { BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

const GROUPS: { key: BreakdownGroupBy; icon: typeof Smartphone }[] = [
  { key: "model", icon: Smartphone },
  { key: "channel", icon: Store },
  { key: "cashier", icon: User },
  { key: "day", icon: Calendar },
]

export function SalesTab({ range, onBreakdown }: ReportTabProps) {
  const { t } = useI18n()
  const [groupBy, setGroupBy] = React.useState<BreakdownGroupBy>("model")
  const { from, to } = range
  const { data, isLoading, error } = useProfitBreakdown(groupBy, from, to)

  const rows = (data ?? []).map((r) => ({
    key: r.key,
    label: r.label,
    value: r.revenue,
    share: r.share,
  }))

  const totalRevenue = rows.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-5">
      {/* Grouping switcher bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[16px] border border-border bg-card p-3 shadow-[var(--shadow-xs)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            {t("reports.breakdownBy")}:
          </span>
          {GROUPS.map(({ key, icon: Icon }) => {
            const isActive = groupBy === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setGroupBy(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {t(`reports.group_${key}`)}
              </button>
            )
          })}
        </div>

        {totalRevenue > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t("dashboard.revenue")}:</span>
            <span className="font-mono font-bold text-foreground">{formatMoney(totalRevenue)}</span>
          </div>
        )}
      </div>

      <BreakdownBarChart
        title={t("reports.salesBreakdownTitle")}
        description={t(`reports.group_${groupBy}`)}
        rows={rows}
        labelHeader={t(`reports.group_${groupBy}`)}
        valueHeader={t("dashboard.revenue")}
        formatValue={formatMoney}
        isLoading={isLoading}
        error={error}
        csvFilename={`sales-by-${groupBy}`}
        onSelect={
          groupBy === "model"
            ? (key) => {
                const row = rows.find((r) => r.key === key)
                onBreakdown({ kind: "salesByModel", modelId: key, label: row?.label ?? key, from, to })
              }
            : undefined
        }
      />
    </div>
  )
}
