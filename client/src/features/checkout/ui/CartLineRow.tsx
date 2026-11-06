import { SlidersHorizontal, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { Button } from "@/shared/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover"
import type { LevelCode } from "@/entities/pricing"
import { CartLine } from "./CartLine"
import { QuantityCartLine } from "./QuantityCartLine"
import { useCartStore, type CartLine as CartLineModel } from "../model/cart.store"
import { lineFinalPrice } from "../lib/line-pricing"

export interface CartLineRowProps {
  line: CartLineModel
  level: LevelCode
  canViewCost: boolean
  minMarginPercent: number
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
}

/**
 * A compact scrollable cart line (ADR 0034 cart-column fix): name, code and
 * price in one dense row, with the full editor — warranty, note, discount,
 * price — tucked into a popover so the seller reaches checkout without scrolling.
 */
export function CartLineRow({
  line,
  level,
  canViewCost,
  minMarginPercent,
  canOverridePrice,
  canDiscountUnlimited,
}: CartLineRowProps) {
  const { t } = useI18n()
  const removeLine = useCartStore((s) => s.removeLine)
  const code = line.kind === "unit" ? unitCode(line.device) : line.barcode
  const label = line.kind === "unit" ? `${line.device.model.brand} ${line.device.model.name}`.trim() : line.name

  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-border bg-white px-3 py-2 shadow-[var(--shadow-xs)]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">
          {label}
          {line.kind === "quantity" ? ` ×${line.quantity}` : ""}
        </p>
        {code && <p className="truncate font-mono text-[11px] text-muted-foreground">{code}</p>}
      </div>
      <span className="shrink-0 text-sm font-bold">{formatMoney(lineFinalPrice(line, level))}</span>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              aria-label={t("pos.lineDetails")}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          }
        />
        <PopoverContent align="end" className="w-80 max-w-[90vw] p-0">
          {line.kind === "quantity" ? (
            <QuantityCartLine
              line={line}
              level={level}
              canOverridePrice={canOverridePrice}
              canDiscountUnlimited={canDiscountUnlimited}
            />
          ) : (
            <CartLine
              line={line}
              level={level}
              canViewCost={canViewCost}
              minMarginPercent={minMarginPercent}
              canOverridePrice={canOverridePrice}
              canDiscountUnlimited={canDiscountUnlimited}
            />
          )}
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-red-600"
        onClick={() => removeLine(line.lineId)}
        aria-label={t("pos.removeLine")}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
