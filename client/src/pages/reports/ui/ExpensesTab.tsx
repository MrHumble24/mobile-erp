import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useExpenseReport } from "@/entities/report"
import { useExpenses } from "@/entities/expense"
import { MetricCard } from "@/shared/ui/metric-card"
import { BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

function RecurringSplit({ from, to }: { from: string; to: string }) {
  const { t } = useI18n()
  const { data } = useExpenses({ from, to, pageSize: 200 })
  const items = data?.items ?? []
  const recurring = items
    .filter((e) => e.isRecurring)
    .reduce((s, e) => s + Number(e.amount), 0)
  const oneOff = items
    .filter((e) => !e.isRecurring)
    .reduce((s, e) => s + Number(e.amount), 0)
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MetricCard label={t("reports.recurring")} value={formatMoney(recurring)} variant="white" />
      <MetricCard label={t("reports.oneOff")} value={formatMoney(oneOff)} variant="white" />
    </div>
  )
}

export function ExpensesTab({ range, onBreakdown }: ReportTabProps) {
  const { t } = useI18n()
  const { from, to, bucket } = range
  const period = bucket === "day" ? "day" : "month"
  const byCategory = useExpenseReport(from, to, "category")
  const byPeriod = useExpenseReport(from, to, period)

  const toSeries = (rows?: { key: string; label: string; total: number; share: number }[]) =>
    (rows ?? []).map((r) => ({ key: r.key, label: r.label, value: r.total, share: r.share }))

  return (
    <div className="space-y-6">
      <RecurringSplit from={from} to={to} />
      <BreakdownBarChart
        title={t("reports.expenseByCategory")}
        rows={toSeries(byCategory.data)}
        labelHeader={t("expenses.category")}
        valueHeader={t("common.amount")}
        formatValue={formatMoney}
        isLoading={byCategory.isLoading}
        error={byCategory.error}
        csvFilename="expenses-by-category"
        onSelect={(key) => {
          const row = byCategory.data?.find((r) => r.key === key)
          onBreakdown({ kind: "expenseCategory", categoryId: key, label: row?.label ?? key, from, to })
        }}
      />
      <BreakdownBarChart
        title={t(`reports.expenseBy_${period}`)}
        rows={toSeries(byPeriod.data)}
        labelHeader={t(`reports.group_${period}`)}
        valueHeader={t("common.amount")}
        formatValue={formatMoney}
        isLoading={byPeriod.isLoading}
        error={byPeriod.error}
        csvFilename={`expenses-by-${period}`}
        limit={31}
      />
    </div>
  )
}
