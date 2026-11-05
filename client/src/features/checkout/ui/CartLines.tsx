import { useI18n } from "@/shared/i18n"
import { CartLine } from "./CartLine"
import { QuantityCartLine } from "./QuantityCartLine"
import { useCartStore } from "../model/cart.store"

export interface CartLinesProps {
  canViewCost: boolean
  minMarginPercent: number
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
}

export function CartLines({
  canViewCost,
  minMarginPercent,
  canOverridePrice,
  canDiscountUnlimited,
}: CartLinesProps) {
  const { t } = useI18n()
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-[16px]">
        <p className="text-base font-medium">{t("pos.cartEmpty")}</p>
        <p className="text-sm mt-1">{t("pos.scanPrompt")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {lines.map((line) =>
        line.kind === "quantity" ? (
          <QuantityCartLine
            key={line.lineId}
            line={line}
            level={level}
            canOverridePrice={canOverridePrice}
            canDiscountUnlimited={canDiscountUnlimited}
          />
        ) : (
          <CartLine
            key={line.lineId}
            line={line}
            level={level}
            canViewCost={canViewCost}
            minMarginPercent={minMarginPercent}
            canOverridePrice={canOverridePrice}
            canDiscountUnlimited={canDiscountUnlimited}
          />
        )
      )}
    </div>
  )
}
