import { Trash2, Minus, Plus, AlertTriangle, Package } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { cn } from "@/shared/lib/utils"
import type { LevelCode } from "@/entities/pricing"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useCartStore, type QuantityCartLine as QuantityCartLineModel } from "../model/cart.store"
import { LinePriceSection } from "./LinePriceSection"
import { lineFinalPrice, lineListCents } from "../lib/line-pricing"
import { useDiscountConfig } from "../model/use-discount-config"

export interface QuantityCartLineProps {
  line: QuantityCartLineModel
  level: LevelCode
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
  embedded?: boolean
}

function QuantityStepper({ line }: { line: QuantityCartLineModel }) {
  const { t } = useI18n()
  const setLineQuantity = useCartStore((s) => s.setLineQuantity)
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{t("catalog.quantity")}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label={t("pos.decreaseQuantity")}
          onClick={() => setLineQuantity(line.lineId, line.quantity - 1)}
        >
          <Minus className="size-3.5" />
        </Button>
        <Input
          type="number"
          min={1}
          value={line.quantity}
          onChange={(e) => setLineQuantity(line.lineId, Number(e.target.value))}
          className="h-9 text-center text-base font-bold tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label={t("pos.increaseQuantity")}
          onClick={() => setLineQuantity(line.lineId, line.quantity + 1)}
        >
          <Plus className="size-3.5" />
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
      <Label className="text-xs font-medium text-muted-foreground">{t("catalog.unitPrice")}</Label>
      <Input
        type="number"
        min={0}
        value={line.unitPrice || ""}
        onChange={(e) => setLineUnitPrice(line.lineId, Number(e.target.value))}
        className="h-10 text-base font-bold tabular-nums"
      />
    </div>
  )
}

export function QuantityCartLine({
  line,
  level,
  canOverridePrice,
  canDiscountUnlimited,
  embedded = false,
}: QuantityCartLineProps) {
  const { t } = useI18n()
  const removeLine = useCartStore((s) => s.removeLine)
  const { enabled: discountsEnabled } = useDiscountConfig(canDiscountUnlimited)
  const overStock = line.quantity > line.onHand
  const listCents = lineListCents(line, level)
  const showFallbackTotal = !discountsEnabled || listCents === null || line.overrideActive

  return (
    <div className={cn("space-y-3", !embedded && "rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]")}>
      <div className="rounded-[12px] bg-muted/40 p-3 border border-border/70 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-[10px] bg-primary/10 text-primary shrink-0">
              <Package className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight text-foreground truncate">{line.name}</h3>
              {line.barcode && (
                <p className="font-mono text-xs text-muted-foreground truncate">{line.barcode}</p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
            onClick={() => removeLine(line.lineId)}
            aria-label={t("pos.removeLine")}
            title={t("pos.removeLine")}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60 text-muted-foreground">
          <span>{t("catalog.onHand")}: <strong className="text-foreground">{t("catalog.pieces", { count: line.onHand })}</strong></span>
        </div>
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

      {showFallbackTotal && (
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2 text-sm">
          <span className="font-medium text-muted-foreground">{t("catalog.lineTotal")}</span>
          <span className="text-base font-bold text-primary tabular-nums whitespace-nowrap">
            {formatMoney(lineFinalPrice(line, level))}
          </span>
        </div>
      )}
    </div>
  )
}
