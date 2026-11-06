import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useProfitBreakdown, type BreakdownRow } from "@/entities/report"
import { Skeleton } from "@/shared/ui/skeleton"
import type { BreakdownProps, RangeParams } from "../model/breakdown.types"

/** Gross profit or units sold per model: table with inline magnitude bars. */
export function ModelMeasureBreakdown({ request }: BreakdownProps) {
  const { t } = useI18n()
  const range = request as RangeParams
  const measure = request.kind === "units" ? "units" : "grossProfit"
  const { data, isLoading } = useProfitBreakdown("model", range.from, range.to)

  if (isLoading) return <Skeleton className="h-64 w-full rounded-[12px]" />
  const rows = data ?? []
  if (rows.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("reports.empty")}
      </p>
    )

  const valueOf = (r: BreakdownRow): number =>
    measure === "units" ? r.unitsSold : r.grossProfit
  const total = rows.reduce((s, r) => s + valueOf(r), 0) || 1
  const max = Math.max(...rows.map(valueOf), 1)
  const format = (v: number): string =>
    measure === "units" ? `${v} ${t("dashboard.unitsSold")}` : formatMoney(v)

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const v = valueOf(r)
        return (
          <div key={r.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold truncate">{r.label}</span>
              <span className="font-mono shrink-0">
                {format(v)}{" "}
                <span className="text-muted-foreground">
                  · {((v / total) * 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-[var(--chart-1)]"
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
