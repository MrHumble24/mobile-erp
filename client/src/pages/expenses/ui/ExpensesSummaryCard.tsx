import { useI18n } from "@/shared/i18n"
import { useExpenseSummary } from "@/entities/expense"
import { MetricCard } from "@/shared/ui/metric-card"

export function ExpensesSummaryCard({
  from,
  to,
}: {
  from?: string
  to?: string
}) {
  const { t } = useI18n()
  const { data: summary, isLoading } = useExpenseSummary({ from, to })

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">{t("common.loading")}</div>
  }

  if (!summary) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label={t("expenses.totalExpenses")}
        value={`$${Number(summary.total).toLocaleString()}`}
        variant="ember"
      />

      <div className="md:col-span-2 rounded-[40px] p-6 bg-card border border-border flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("expenses.summaryTitle")}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {summary.byCategory.map((item) => (
            <div key={item.categoryId} className="p-3 bg-muted/40 rounded-xl">
              <span className="text-xs text-muted-foreground line-clamp-1">{item.name}</span>
              <p className="font-mono font-bold text-base mt-1">
                ${Number(item.total).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
