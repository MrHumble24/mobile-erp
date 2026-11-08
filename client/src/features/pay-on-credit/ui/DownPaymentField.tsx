import { Banknote } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { formatMoney } from "@/shared/lib/format"
import { PaymentMethodField, type PaymentMethod, type PaymentPart } from "@/entities/ledger"

export interface DownPaymentFieldProps {
  agreedTotal?: number
  downPayment: number
  onDownPaymentChange: (v: number) => void
  newUnpaid?: number
  method: PaymentMethod
  onMethodChange: (m: PaymentMethod) => void
  splitParts: PaymentPart[]
  onSplitPartsChange: (p: PaymentPart[]) => void
}

const DOWN_PAYMENT_PRESETS = [0, 10, 20, 30, 50]

/** The down payment: an amount paid now, tendered by cash, card or split. */
export function DownPaymentField({
  agreedTotal = 0,
  downPayment,
  onDownPaymentChange,
  newUnpaid,
  method,
  onMethodChange,
  splitParts,
  onSplitPartsChange,
}: DownPaymentFieldProps) {
  const { t } = useI18n()

  const maxAmount = agreedTotal > 0 ? agreedTotal : undefined

  const setPresetPercent = (pct: number) => {
    if (pct === 0) {
      onDownPaymentChange(0)
    } else if (agreedTotal > 0) {
      const calculated = Math.round((agreedTotal * pct) / 100)
      onDownPaymentChange(calculated)
    }
  }

  return (
    <section className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold tracking-tight flex items-center gap-2">
          <Banknote className="size-4 text-primary" />
          {t("credit.downPayment")}
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          {downPayment > 0 && agreedTotal > 0
            ? `${Math.round((downPayment / agreedTotal) * 100)}%`
            : "0%"}
        </span>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)] space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                max={maxAmount}
                value={downPayment || ""}
                onChange={(e) => onDownPaymentChange(Math.max(0, Math.min(agreedTotal, Number(e.target.value) || 0)))}
                className="h-12 font-mono text-xl font-bold tabular-nums pr-8"
                placeholder="0"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                $
              </span>
            </div>

            <div className="flex gap-1 shrink-0">
              {DOWN_PAYMENT_PRESETS.map((pct) => {
                const isSelected =
                  pct === 0
                    ? downPayment === 0
                    : Math.round((downPayment / agreedTotal) * 100) === pct
                return (
                  <Button
                    key={pct}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-12 px-2.5 font-mono text-xs font-semibold"
                    onClick={() => setPresetPercent(pct)}
                  >
                    {pct}%
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Payment method selector when down payment > 0 */}
        {downPayment > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/80">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t("credit.tenderMethod")}
            </Label>
            <PaymentMethodField
              total={downPayment}
              method={method}
              parts={splitParts}
              onMethodChange={onMethodChange}
              onPartsChange={onSplitPartsChange}
            />
          </div>
        )}

        {/* Balance remaining */}
        {newUnpaid !== undefined && (
          <div className="flex items-center justify-between rounded-[12px] bg-muted/50 px-4 py-2.5 border border-border/60">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("credit.remainingToPay")}
            </span>
            <span className="font-mono text-base font-bold tabular-nums text-foreground">
              {formatMoney(newUnpaid)}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
