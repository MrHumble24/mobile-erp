import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useExpenseSummary } from "@/entities/expense"
import { BreakdownBarChart } from "@/widgets/report-charts"

export function ExpenseBreakdown({ from, to }: { from?: string; to?: string }) {
  const { t } = useI18n()
  const { data, isLoading, error } = useExpenseSummary({ from, to })

  const total = data?.total ?? 0
  const rows = (data?.byCategory ?? []).map((c) => ({
    key: c.categoryId,
    label: c.name,
    value: c.total,
    share: total > 0 ? c.total / total : 0,
  }))

  return (
    <BreakdownBarChart
      title={t("expenses.breakdownTitle")}
      rows={rows}
      labelHeader={t("expenses.category")}
      valueHeader={t("common.amount")}
      formatValue={formatMoney}
      isLoading={isLoading}
      error={error}
      csvFilename="expenses-by-category"
    />
  )
}
