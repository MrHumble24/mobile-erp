import { Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { LevelCode } from "@/entities/pricing"
import { DeviceCard } from "./DeviceCard"
import { PriceGuidance } from "./PriceGuidance"
import { LinePriceSection } from "./LinePriceSection"
import { useCartStore, type UnitCartLine } from "../model/cart.store"

export interface CartLineProps {
  line: UnitCartLine
  level: LevelCode
  canViewCost: boolean
  minMarginPercent: number
  canOverridePrice: boolean
  canDiscountUnlimited: boolean
}

function WarrantyAndNotes({ line }: { line: UnitCartLine }) {
  const { t } = useI18n()
  const setLineWarranty = useCartStore((s) => s.setLineWarranty)
  const setLineNotes = useCartStore((s) => s.setLineNotes)
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label>{t("pos.warrantyDays")}</Label>
        <Input
          type="number"
          min={0}
          value={line.warrantyDays}
          onChange={(e) => setLineWarranty(line.lineId, Number(e.target.value))}
          className="h-10"
        />
      </div>
      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input
          value={line.notes}
          onChange={(e) => setLineNotes(line.lineId, e.target.value)}
          placeholder="..."
          className="h-10"
        />
      </div>
    </div>
  )
}

/** The free-price input + guidance, shown only on the typed/override path. */
function TypedPrice({ line, canViewCost, minMarginPercent }: Pick<CartLineProps, "line" | "canViewCost" | "minMarginPercent">) {
  const { t } = useI18n()
  const setLinePrice = useCartStore((s) => s.setLinePrice)
  const setConfirmed = useCartStore((s) => s.setLineBelowCostConfirmed)
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>{t("pos.salePrice")}</Label>
        <Input
          type="number"
          min={0}
          value={line.salePrice || ""}
          onChange={(e) => setLinePrice(line.lineId, Number(e.target.value))}
          className="h-11 text-lg font-bold"
        />
      </div>
      <PriceGuidance
        salePrice={line.salePrice}
        targetPrice={line.device.targetPrice}
        landedCost={line.device.landedCost}
        canViewCost={canViewCost}
        minMarginPercent={minMarginPercent}
        belowCostConfirmed={line.belowCostConfirmed}
        onPriceChange={(p) => setLinePrice(line.lineId, p)}
        onBelowCostConfirmedChange={(c) => setConfirmed(line.lineId, c)}
      />
    </div>
  )
}

export function CartLine({
  line,
  level,
  canViewCost,
  minMarginPercent,
  canOverridePrice,
  canDiscountUnlimited,
}: CartLineProps) {
  const { t } = useI18n()
  const removeLine = useCartStore((s) => s.removeLine)

  return (
    <div className="rounded-[16px] border border-border bg-card p-3 shadow-[var(--shadow-xs)] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <DeviceCard device={line.device} />
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
      <WarrantyAndNotes line={line} />
      <LinePriceSection
        line={line}
        level={level}
        canOverridePrice={canOverridePrice}
        canDiscountUnlimited={canDiscountUnlimited}
      >
        <TypedPrice line={line} canViewCost={canViewCost} minMarginPercent={minMarginPercent} />
      </LinePriceSection>
    </div>
  )
}
