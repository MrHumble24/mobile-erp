import { AlertTriangle, Phone, UserRound, ArrowRightLeft } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"

export interface CreditCustomerSummaryProps {
  name: string
  phone: string
  outstanding: string
  effectiveLimit: string | null
  overLimit: boolean
  onChangeCustomer?: () => void
}

/** The buyer's current debt and limit, with an over-limit warning (ADR 0035). */
export function CreditCustomerSummary({
  name,
  phone,
  outstanding,
  effectiveLimit,
  overLimit,
  onChangeCustomer,
}: CreditCustomerSummaryProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-3 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">{name}</p>
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              {phone}
            </p>
          </div>
        </div>

        {onChangeCustomer && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onChangeCustomer}
            className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowRightLeft className="size-3.5" />
            {t("credit.changeCustomer")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-[12px] border border-border/80 bg-muted/50 p-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("credit.currentDebt")}
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground">
            {formatMoney(outstanding)}
          </p>
        </div>
        <div className="rounded-[12px] border border-border/80 bg-muted/50 p-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("credit.effectiveLimit")}
          </p>
          <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground">
            {effectiveLimit === null ? t("credit.noLimit") : formatMoney(effectiveLimit)}
          </p>
        </div>
      </div>

      {overLimit && (
        <div className="flex items-center gap-2 rounded-[10px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{t("credit.errorLimit")}</span>
        </div>
      )}
    </div>
  )
}
