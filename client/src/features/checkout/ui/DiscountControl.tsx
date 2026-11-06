import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { DiscountMode, LevelCode } from "@/entities/pricing"
import { discountCapPercent, discountError } from "@/entities/pricing"
import { useCartStore, type CartLine } from "../model/cart.store"
import { useDiscountConfig } from "../model/use-discount-config"
import { lineFinalPrice, lineListCents } from "../lib/line-pricing"

export interface DiscountControlProps {
  line: CartLine
  level: LevelCode
  canDiscountUnlimited: boolean
}

/** Per-line discount: mode, preset quick values, and the final price (ADR 0034). */
export function DiscountControl({ line, level, canDiscountUnlimited }: DiscountControlProps) {
  const { t } = useI18n()
  const setLineDiscount = useCartStore((s) => s.setLineDiscount)
  const { enabled, rules, presetsPercent, presetsAmount } = useDiscountConfig(canDiscountUnlimited)

  const listCents = lineListCents(line, level)
  // Hide the whole control when discounts are off or the line has no list price.
  if (!enabled || listCents === null || line.overrideActive) return null

  const discount = line.discount
  const mode: DiscountMode = discount?.mode ?? (rules.percentAllowed ? "PERCENT" : "AMOUNT")
  const value = discount?.value ?? 0
  const presets = mode === "PERCENT" ? presetsPercent : presetsAmount
  const error = discountError(listCents, discount, rules)
  const errorMsg =
    error === "errorDiscountTooHigh"
      ? t("pricing.errorDiscountTooHigh", { max: discountCapPercent(rules) })
      : error
        ? t(`pricing.${error}`)
        : null

  const apply = (next: number) => setLineDiscount(line.lineId, next > 0 ? { mode, value: next } : null)
  const setMode = (m: DiscountMode) => setLineDiscount(line.lineId, value > 0 ? { mode: m, value } : null)

  return (
    <div className="space-y-2 border-t border-dashed border-border pt-2">
      <div className="flex items-center justify-between">
        <Label>{t("pricing.discountOnLine")}</Label>
        {value > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => apply(0)}>
            {t("pricing.noDiscount")}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rules.percentAllowed && rules.amountAllowed && (
          <div className="flex rounded-[10px] border border-border p-0.5">
            {(["PERCENT", "AMOUNT"] as DiscountMode[]).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={mode === m ? "default" : "ghost"}
                className="h-8 px-2 text-xs"
                onClick={() => setMode(m)}
              >
                {t(m === "PERCENT" ? "pricing.discountPercent" : "pricing.discountAmount")}
              </Button>
            ))}
          </div>
        )}
        <Input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => apply(Number(e.target.value))}
          className="h-9 flex-1"
          placeholder={mode === "PERCENT" ? "%" : formatMoney(0)}
        />
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Button
              key={p}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs whitespace-nowrap tabular-nums"
              onClick={() => apply(p)}
            >
              {mode === "PERCENT" ? `${p}%` : formatMoney(p)}
            </Button>
          ))}
        </div>
      )}
      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
      <div className="flex items-center justify-between gap-2 min-w-0 text-sm">
        <span className="text-muted-foreground truncate">{t("pricing.finalPrice")}</span>
        <span className="text-base font-bold text-primary shrink-0 whitespace-nowrap tabular-nums">{formatMoney(lineFinalPrice(line, level))}</span>
      </div>
    </div>
  )
}
