import { CalendarDays, Calendar, Clock, CheckCircle2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { formatMoney } from "@/shared/lib/format"
import { fromCents, toCents } from "@/entities/credit"
import type { useCreditDraft } from "../model/use-credit-draft"

const TERM_PRESETS = [3, 6, 9, 12]

interface CreditPlanSectionProps {
  draft: ReturnType<typeof useCreditDraft>
  balanced: boolean
}

/**
 * Payment plan & schedule: all seats/installments are rendered completely
 * visible in document flow — NO nested scroll, so no row or amount is ever missed.
 */
export function CreditPlanSection({ draft, balanced }: CreditPlanSectionProps) {
  const { t } = useI18n()

  const totalScheduledCents = draft.instalments.reduce(
    (sum, row) => sum + toCents(row.amount),
    0
  )

  return (
    <section className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          {t("credit.planTitle")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("credit.eachPart")}:</span>
          <span className="font-mono text-sm font-bold text-foreground">
            {draft.instalments.length > 0 ? formatMoney(draft.instalments[0].amount) : "$0"}
          </span>
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)] space-y-4">
        {/* Parts Count & Quick Term Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("credit.parts")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={draft.parts || ""}
              onChange={(e) => draft.setParts(Math.max(1, Math.trunc(Number(e.target.value) || 1)))}
              className="h-11 w-24 font-mono text-base font-semibold tabular-nums"
            />
            <div className="flex gap-1 flex-1">
              {TERM_PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={draft.parts === p ? "default" : "outline"}
                  size="sm"
                  className="h-11 flex-1 font-mono text-xs font-semibold"
                  onClick={() => draft.setParts(p)}
                >
                  {t("credit.termMonths", { n: p })}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* First Due Date & Frequency Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/80">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              {t("credit.firstDue")}
            </Label>
            <Input
              type="date"
              value={draft.firstDue}
              onChange={(e) => draft.setFirstDue(e.target.value)}
              className="h-11 font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              {t("credit.frequency")}
            </Label>
            <div className="flex gap-1.5 h-11">
              <Button
                type="button"
                variant={draft.frequency === "month" ? "default" : "outline"}
                onClick={() => draft.setFrequency("month")}
                className="flex-1 h-full text-xs font-semibold"
              >
                {t("credit.everyMonth")}
              </Button>
              <Button
                type="button"
                variant={draft.frequency === "week" ? "default" : "outline"}
                onClick={() => draft.setFrequency("week")}
                className="flex-1 h-full text-xs font-semibold"
              >
                {t("credit.everyWeek")}
              </Button>
            </div>
          </div>
        </div>

        {/* Full Schedule: Every seat completely visible without internal scrolling */}
        <div className="space-y-2.5 pt-2 border-t border-border/80">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-2">
            <span>{t("credit.schedule")}</span>
            <span>{t("credit.amount")}</span>
          </div>

          <div className="space-y-2">
            {draft.instalments.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-[12px] bg-muted/40 p-3 text-sm border border-border/60 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-7 place-items-center rounded-full bg-card font-mono text-xs font-bold text-foreground border border-border/80 shrink-0 shadow-xs">
                    {i + 1}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-xs text-foreground">
                      {t("credit.instalment", { n: i + 1 })}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Calendar className="size-3 text-primary shrink-0" />
                      <Input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => draft.setInstalmentDue(i, e.target.value)}
                        className="h-6 w-auto p-0 border-0 bg-transparent text-xs font-mono font-medium text-foreground/80 focus:ring-1 focus:ring-primary rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-bold tabular-nums text-foreground">
                    {formatMoney(row.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {draft.instalments.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground font-medium">
              {t("credit.noPlanYet")}
            </p>
          ) : (
            <div className="flex items-center justify-between rounded-[12px] bg-muted/60 px-4 py-2.5 border border-border/60 mt-3 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                {balanced && <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                {t("credit.planBalanced")} ({draft.frequency === "week" ? t("credit.termWeeks", { n: draft.instalments.length }) : t("credit.termMonths", { n: draft.instalments.length })})
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                {formatMoney(fromCents(totalScheduledCents))}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

