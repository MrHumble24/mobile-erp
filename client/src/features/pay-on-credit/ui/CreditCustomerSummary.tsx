import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"

export interface CreditCustomerSummaryProps {
  name: string
  phone: string
  outstanding: string
  effectiveLimit: string | null
  overLimit: boolean
}

/** The buyer's current debt and limit, with an over-limit warning (ADR 0035). */
export function CreditCustomerSummary({
  name,
  phone,
  outstanding,
  effectiveLimit,
  overLimit,
}: CreditCustomerSummaryProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[10px] border border-border bg-muted p-2.5 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{t("credit.currentDebt")}</p>
          <p className="mt-0.5 text-sm font-semibold whitespace-nowrap tabular-nums">{formatMoney(outstanding)}</p>
          <p className="truncate text-[11px] text-muted-foreground">{name} · {phone}</p>
        </div>
        <div className="rounded-[10px] border border-border bg-muted p-2.5 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{t("credit.effectiveLimit")}</p>
          <p className="mt-0.5 text-sm font-semibold whitespace-nowrap tabular-nums">
            {effectiveLimit === null ? t("credit.noLimit") : formatMoney(effectiveLimit)}
          </p>
        </div>
      </div>
      {overLimit && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          {t("credit.errorLimit")}
        </p>
      )}
    </div>
  )
}
