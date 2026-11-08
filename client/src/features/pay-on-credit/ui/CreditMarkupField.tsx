import { HandCoins, Percent, DollarSign, ShieldCheck } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { formatMoney } from "@/shared/lib/format"
import { useCreditMarkup, type MarkupMode } from "../model/use-credit-markup"

const PERCENT_PRESETS = [0, 5, 10, 15, 20]

/**
 * The disclosed Murabaha margin (ADR 0068): one fixed margin agreed up front,
 * entered either as a percent of the cash price or a fixed sum. Switching modes
 * keeps the same margin amount. Never interest, never grows.
 */
export function CreditMarkupField({ markup }: { markup: ReturnType<typeof useCreditMarkup> }) {
  const { t } = useI18n()
  const isPercent = markup.mode === "percent"

  return (
    <section className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold tracking-tight flex items-center gap-2">
          <HandCoins className="size-4 text-primary" />
          {t("credit.pricingSummary")}
        </h2>
        <Tabs value={markup.mode} onValueChange={(v) => markup.changeMode(v as MarkupMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="percent" className="px-2.5 text-xs gap-1">
              <Percent className="size-3" />
              {t("credit.markupPercent")}
            </TabsTrigger>
            <TabsTrigger value="amount" className="px-2.5 text-xs gap-1">
              <DollarSign className="size-3" />
              {t("common.amount")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)] space-y-4">
        {/* Cash Price vs Markup Summary */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/80">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("credit.cashPrice")}
            </p>
            <p className="mt-0.5 font-mono text-base font-bold tabular-nums">
              {formatMoney(markup.cashTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("credit.markup")}
            </p>
            <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {markup.markup > 0 ? `+ ${formatMoney(markup.markup)}` : "$0"}
            </p>
          </div>
        </div>

        {/* Input & Quick Presets */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs font-semibold text-muted-foreground">
              {isPercent ? t("credit.markupPercent") : t("credit.markup")}
            </Label>
            {isPercent && (
              <span className="font-mono text-xs text-muted-foreground">
                = {formatMoney(markup.markup)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                max={isPercent ? 100 : markup.cashTotal}
                value={isPercent ? (markup.percent || "") : (markup.amount || "")}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value) || 0)
                  if (isPercent) markup.changePercent(Math.min(100, v))
                  else markup.changeAmount(v)
                }}
                className="h-11 font-mono text-base font-semibold tabular-nums pr-8"
                placeholder="0"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                {isPercent ? "%" : "$"}
              </span>
            </div>

            {isPercent && (
              <div className="flex gap-1">
                {PERCENT_PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={markup.percent === p ? "default" : "outline"}
                    size="sm"
                    className="h-11 px-2.5 font-mono text-xs font-semibold"
                    onClick={() => markup.changePercent(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agreed Total Banner */}
        <div className="flex items-center justify-between rounded-[12px] bg-muted/60 px-4 py-3 border border-border/60">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("credit.agreedTotal")}
            </span>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
              {t("credit.noInterest")}
            </p>
          </div>
          <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {formatMoney(markup.agreedTotal)}
          </span>
        </div>
      </div>
    </section>
  )
}
