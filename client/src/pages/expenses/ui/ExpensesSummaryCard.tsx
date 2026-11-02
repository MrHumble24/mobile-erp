import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
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
        value={formatMoney(summary.total)}
        variant="white"
      />

      <div className="md:col-span-2 rounded-[16px] p-6 bg-white border border-[#e8e8e8] shadow-[var(--shadow-xs)] flex flex-col justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("expenses.summaryTitle")}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {summary.byCategory.map((item) => (
            <div key={item.categoryId} className="p-3 bg-[#f8f9fa] border border-[#e8e8e8] rounded-[12px]">
              <span className="text-xs text-muted-foreground line-clamp-1">{item.name}</span>
              <p className="font-mono font-bold text-base mt-1">
                {formatMoney(item.total)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

