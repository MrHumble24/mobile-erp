import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useProfitReport } from "@/entities/report"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import type { BreakdownProps, BreakdownRequest, RangeParams } from "../model/breakdown.types"

function Term({
  label,
  value,
  onClick,
  sign,
}: {
  label: string
  value: number
  onClick: () => void
  sign?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {sign && <span className="font-mono text-lg text-muted-foreground">{sign}</span>}
      <Button
        type="button"
        variant="outline"
        className="h-auto flex-1 justify-between rounded-[12px] px-4 py-3"
        onClick={onClick}
      >
        <span className="font-semibold">{label}</span>
        <span className="font-mono font-bold">{formatMoney(value)}</span>
      </Button>
    </div>
  )
}

export function NoiBreakdown({ request, onOpen }: BreakdownProps) {
  const { t } = useI18n()
  const range = request as RangeParams
  const { data, isLoading } = useProfitReport(range.from, range.to)
  if (isLoading || !data)
    return <Skeleton className="h-64 w-full rounded-[12px]" />

  const open = (kind: BreakdownRequest["kind"]) =>
    onOpen({ kind, from: range.from, to: range.to } as BreakdownRequest)

  return (
    <div className="space-y-3">
      <Term label={t("dashboard.revenue")} value={data.revenue} onClick={() => open("revenue")} />
      <Term label={t("dashboard.cogs")} value={data.cogs} onClick={() => open("cogs")} sign="−" />
      <Term label={t("dashboard.expenses")} value={data.expenses} onClick={() => open("expenses")} sign="−" />
      <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#111111] px-4 py-3 text-white">
        <span className="font-semibold">{t("dashboard.netOperatingIncome")}</span>
        <span className="font-mono font-bold">{formatMoney(data.netOperatingIncome)}</span>
      </div>
    </div>
  )
}
