import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { DiscountMode } from "@/entities/pricing"
import { discountCapPercent } from "@/entities/pricing"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useCartStore } from "../model/cart.store"
import { useDiscountConfig } from "../model/use-discount-config"
import { cartTotals } from "../lib/line-pricing"

export interface CartDiscountControlProps {
  canDiscountUnlimited: boolean
}

/**
 * A whole-cart discount (ADR 0034): a convenience that spreads in proportion to
 * line list prices and ends up as per-line discounts (cent-exact). Hidden when
 * discounts are off or no line has a list price.
 */
export function CartDiscountControl({ canDiscountUnlimited }: CartDiscountControlProps) {
  const { t } = useI18n()
  const { enabled, rules, presetsPercent, presetsAmount } = useDiscountConfig(canDiscountUnlimited)
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)
  const applyCartDiscount = useCartStore((s) => s.applyCartDiscount)
  const [mode, setMode] = React.useState<DiscountMode>(rules.percentAllowed ? "PERCENT" : "AMOUNT")
  const [value, setValue] = React.useState(0)

  const totals = cartTotals(lines, level)
  const hasAnyList = totals.listTotal > totals.dueTotal || totals.discountTotal !== 0 || lines.length > 0
  if (!enabled || !hasAnyList) return null

  const presets = mode === "PERCENT" ? presetsPercent : presetsAmount
  const over = !rules.unlimited && mode === "PERCENT" && value > discountCapPercent(rules)

  const apply = (next: number) => {
    setValue(next)
    applyCartDiscount(next > 0 ? { mode, value: next } : null)
  }

  return (
    <div className="rounded-[16px] border border-border bg-card p-3 shadow-[var(--shadow-xs)] space-y-2">
      <Label>{t("pricing.discountOnCart")}</Label>
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
                onClick={() => {
                  setMode(m)
                  applyCartDiscount(value > 0 ? { mode: m, value } : null)
                }}
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
        {value > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => apply(0)}>
            {t("pricing.noDiscount")}
          </Button>
        )}
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Button key={p} type="button" variant="outline" size="sm" className="h-7 text-xs whitespace-nowrap tabular-nums" onClick={() => apply(p)}>
              {mode === "PERCENT" ? `${p}%` : formatMoney(p)}
            </Button>
          ))}
        </div>
      )}
      {over && (
        <p className="text-xs text-red-600">
          {t("pricing.errorDiscountTooHigh", { max: discountCapPercent(rules) })}
        </p>
      )}
    </div>
  )
}
