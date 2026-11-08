import * as React from "react"
import { Pencil } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { fromCents, type LevelCode } from "@/entities/pricing"
import { Button } from "@/shared/ui/button"
import { useCartStore, type CartLine } from "../model/cart.store"
import { DiscountControl } from "./DiscountControl"
import { lineListCents } from "../lib/line-pricing"

export interface LinePriceSectionProps {
  line: CartLine
  level: LevelCode
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
  /** The "type a price" input the parent renders (unit salePrice or quantity unitPrice). */
  children: React.ReactNode
}

/**
 * The pricing block of a cart line (ADR 0034): the list price for the current
 * level, a discount control, and — only when the shop set no list price or a
 * `sale.price.override` cashier turned on "type a price" — the free-price input.
 */
export function LinePriceSection({
  line,
  level,
  canOverridePrice,
  canDiscountUnlimited,
  children,
}: LinePriceSectionProps) {
  const { t } = useI18n()
  const setLineOverride = useCartStore((s) => s.setLineOverride)
  const listCents = lineListCents(line, level)
  const hasList = listCents !== null
  const showTyped = !hasList || line.overrideActive

  return (
    <div className="space-y-2">
      {hasList && (
        <div className="flex items-center justify-between gap-2 min-w-0 text-sm">
          <span className="text-xs font-medium text-muted-foreground truncate">{t("pricing.listPrice")}</span>
          <span className="font-semibold text-sm shrink-0 whitespace-nowrap tabular-nums">{formatMoney(fromCents(listCents))}</span>
        </div>
      )}
      {showTyped && children}
      {hasList && canOverridePrice && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-1.5"
          onClick={() => setLineOverride(line.lineId, !line.overrideActive)}
          title={t("pricing.priceOverrideHint")}
        >
          <Pencil className="size-3" />
          <span>{line.overrideActive ? t("pricing.listPrice") : t("pricing.priceOverride")}</span>
        </Button>
      )}
      <DiscountControl line={line} level={level} canDiscountUnlimited={canDiscountUnlimited} />
    </div>
  )
}
