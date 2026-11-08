import { HandCoins, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { formatMoney } from "@/shared/lib/format"
import { fromCents } from "@/entities/credit"
import { cn } from "@/shared/lib/utils"
import type { CreditLineDto } from "@/entities/credit"

function ReviewRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string
  value: string
  accent?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "shrink-0 font-mono tabular-nums",
          bold ? "font-bold text-foreground" : "font-semibold text-foreground/90",
          accent && "text-emerald-600 dark:text-emerald-400 font-bold"
        )}
      >
        {value}
      </span>
    </div>
  )
}

interface CreditReviewPanelProps {
  lines: CreditLineDto[]
  cashPrice: number
  markupAmount: number
  agreedTotal: number
  downPayment: number
  newUnpaid: number
  remainingCents: number
  balanced: boolean
  offline: boolean
  isPending: boolean
  canSell: boolean
  partsCount?: number
  frequency?: "month" | "week"
  onSell: () => void
}

export function CreditReviewPanel({
  lines,
  cashPrice,
  markupAmount,
  agreedTotal,
  downPayment,
  newUnpaid,
  remainingCents,
  balanced,
  offline,
  isPending,
  canSell,
  partsCount,
  frequency,
  onSell,
}: CreditReviewPanelProps) {
  const { t } = useI18n()

  return (
    <aside className="h-fit min-w-0 space-y-4 lg:sticky lg:top-4">
      {/* Top Agreed Total Card */}
      <div className="rounded-[18px] border border-border bg-card p-5 shadow-[var(--shadow-xs)] space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("credit.pay")}
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-3xl font-extrabold tabular-nums tracking-tight text-foreground xl:text-4xl">
            {formatMoney(agreedTotal)}
          </p>
          <span className="font-mono text-xs text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
            {t("pos.lineCount", { count: lines.length })}
          </span>
        </div>
        {partsCount && partsCount > 1 && (
          <p className="text-xs text-muted-foreground pt-1">
            {frequency === "week" ? t("credit.termWeeks", { n: partsCount }) : t("credit.termMonths", { n: partsCount })}
          </p>
        )}
      </div>

      {/* Financial Breakdown Card */}
      <div className="rounded-[18px] border border-border bg-card p-5 shadow-[var(--shadow-xs)] space-y-3">
        <div className="divide-y divide-border/60">
          <ReviewRow label={t("credit.cashPrice")} value={formatMoney(cashPrice)} />
          {markupAmount > 0 && (
            <ReviewRow label={t("credit.markup")} value={`+ ${formatMoney(markupAmount)}`} accent />
          )}
          {downPayment > 0 && (
            <ReviewRow label={t("credit.downPayment")} value={formatMoney(downPayment)} />
          )}
          <ReviewRow
            label={t("credit.outstanding")}
            value={formatMoney(newUnpaid)}
            bold
          />
        </div>

        {/* Allocation status */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-2.5 text-xs font-semibold",
            balanced
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          )}
        >
          <span className="flex items-center gap-1.5">
            {balanced ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <AlertCircle className="size-3.5 shrink-0" />
            )}
            {balanced ? t("credit.planBalanced") : t("credit.planRemaining")}
          </span>
          <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
            {formatMoney(fromCents(remainingCents))}
          </span>
        </div>
      </div>

      {offline && (
        <div className="rounded-[12px] border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{t("credit.errorOffline")}</span>
        </div>
      )}

      {/* Main Action Button */}
      <Button
        type="button"
        size="lg"
        className="h-14 w-full gap-2.5 text-base font-bold shadow-md cursor-pointer disabled:cursor-not-allowed"
        disabled={!canSell}
        onClick={onSell}
      >
        <HandCoins className="size-5 shrink-0" />
        {isPending ? t("common.loading") : t("credit.sellButton")}
      </Button>

      {/* Trust disclosure */}
      <div className="rounded-[12px] bg-muted/40 p-3 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground leading-normal">
          <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {t("credit.noInterest")}
        </p>
      </div>
    </aside>
  )
}
