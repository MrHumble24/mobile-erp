import { useI18n } from "@/shared/i18n"
import { CartLineRow } from "./CartLineRow"
import { useCartStore } from "../model/cart.store"

export interface CompactCartLinesProps {
  canViewCost: boolean
  minMarginPercent: number
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
}

/**
 * The cart lines as a dense, scrollable list (ADR 0034 cart-column fix). Each
 * line is a compact row; its full editor lives in a popover. The scroll region
 * is owned by the parent column so the totals + checkout stay pinned in view.
 */
export function CompactCartLines({
  canViewCost,
  minMarginPercent,
  canOverridePrice,
  canDiscountUnlimited,
}: CompactCartLinesProps) {
  const { t } = useI18n()
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)

  if (lines.length === 0) {
    return (
      <div className="rounded-[14px] border-2 border-dashed py-10 text-center text-muted-foreground">
        <p className="text-sm font-medium">{t("pos.cartEmpty")}</p>
        <p className="mt-1 text-xs">{t("pos.scanPrompt")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <CartLineRow
          key={line.lineId}
          line={line}
          level={level}
          canViewCost={canViewCost}
          minMarginPercent={minMarginPercent}
          canOverridePrice={canOverridePrice}
          canDiscountUnlimited={canDiscountUnlimited}
        />
      ))}
    </div>
  )
}
