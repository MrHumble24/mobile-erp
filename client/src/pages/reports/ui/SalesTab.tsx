import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useProfitBreakdown, type BreakdownGroupBy } from "@/entities/report"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Label } from "@/shared/ui/label"
import { BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

const GROUPS: BreakdownGroupBy[] = ["channel", "model", "cashier", "day"]

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

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label>{t("reports.breakdownBy")}</Label>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as BreakdownGroupBy)}>
          <SelectTrigger className="h-10 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUPS.map((g) => (
              <SelectItem key={g} value={g}>
                {t(`reports.group_${g}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <BreakdownBarChart
        title={t("reports.salesBreakdownTitle")}
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
