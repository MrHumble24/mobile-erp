import { Trash2, Minus, Plus, AlertTriangle, Package } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { LevelCode } from "@/entities/pricing"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useCartStore, type QuantityCartLine as QuantityCartLineModel } from "../model/cart.store"
import { LinePriceSection } from "./LinePriceSection"
import { lineFinalPrice } from "../lib/line-pricing"

export interface QuantityCartLineProps {
  line: QuantityCartLineModel
  level: LevelCode
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
}

function QuantityStepper({ line }: { line: QuantityCartLineModel }) {
  const { t } = useI18n()
  const setLineQuantity = useCartStore((s) => s.setLineQuantity)
  return (
    <div className="space-y-1">
      <Label>{t("catalog.quantity")}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={t("pos.decreaseQuantity")}
          onClick={() => setLineQuantity(line.lineId, line.quantity - 1)}
        >
          <Minus className="size-4" />
        </Button>
        <Input
          type="number"
          min={1}
          value={line.quantity}
          onChange={(e) => setLineQuantity(line.lineId, Number(e.target.value))}
          className="h-10 text-center text-lg font-bold"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={t("pos.increaseQuantity")}
          onClick={() => setLineQuantity(line.lineId, line.quantity + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function TypedUnitPrice({ line }: { line: QuantityCartLineModel }) {
  const { t } = useI18n()
  const setLineUnitPrice = useCartStore((s) => s.setLineUnitPrice)
  return (
    <div className="space-y-1">
      <Label>{t("catalog.unitPrice")}</Label>
      <Input
        type="number"
        min={0}
        value={line.unitPrice || ""}
        onChange={(e) => setLineUnitPrice(line.lineId, Number(e.target.value))}
        className="h-10 text-lg font-bold"
      />
    </div>
  )
}

export function QuantityCartLine({
  line,
  level,
  canOverridePrice,
  canDiscountUnlimited,
}: QuantityCartLineProps) {
  const { t } = useI18n()
  const removeLine = useCartStore((s) => s.removeLine)
  const overStock = line.quantity > line.onHand

  return (
    <div className="rounded-[16px] border border-border bg-card p-3 shadow-[var(--shadow-xs)] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base leading-tight truncate">{line.name}</h3>
            {line.barcode && (
              <p className="font-mono text-xs text-muted-foreground">{line.barcode}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("catalog.onHand")}: {t("catalog.pieces", { count: line.onHand })}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-600 shrink-0"
          onClick={() => removeLine(line.lineId)}
          aria-label={t("pos.removeLine")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <QuantityStepper line={line} />
      <LinePriceSection
        line={line}
        level={level}
        canOverridePrice={canOverridePrice}
        canDiscountUnlimited={canDiscountUnlimited}
      >
        <TypedUnitPrice line={line} />
      </LinePriceSection>

      {overStock && (
        <div className="flex items-center gap-2 rounded-[10px] border border-amber-300 bg-amber-500/10 p-2 text-xs text-amber-700">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{t("catalog.belowZero")}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 min-w-0 border-t border-border pt-2 text-sm">
        <span className="text-muted-foreground truncate">{t("catalog.lineTotal")}</span>
        <span className="text-lg font-bold text-primary shrink-0 whitespace-nowrap tabular-nums">{formatMoney(lineFinalPrice(line, level))}</span>
      </div>
    </div>
  )
}
