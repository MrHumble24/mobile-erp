import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { cn } from "@/shared/lib/utils"
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
  embedded?: boolean
}

function WarrantyAndNotes({ line }: { line: UnitCartLine }) {
  const { t } = useI18n()
  const setLineWarranty = useCartStore((s) => s.setLineWarranty)
  const setLineNotes = useCartStore((s) => s.setLineNotes)
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">{t("pos.warrantyDays")}</Label>
        <Input
          type="number"
          min={0}
          value={line.warrantyDays}
          onChange={(e) => setLineWarranty(line.lineId, Number(e.target.value))}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">{t("common.notes")}</Label>
        <Input
          value={line.notes}
          onChange={(e) => setLineNotes(line.lineId, e.target.value)}
          placeholder="..."
          className="h-9 text-sm"
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
        <Label className="text-xs font-medium text-muted-foreground">{t("pos.salePrice")}</Label>
        <Input
          type="number"
          min={0}
          value={line.salePrice || ""}
          onChange={(e) => setLinePrice(line.lineId, Number(e.target.value))}
          className="h-10 text-base font-bold tabular-nums"
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
  embedded = false,
}: CartLineProps) {
  const { t } = useI18n()
  const removeLine = useCartStore((s) => s.removeLine)

  return (
    <div className={cn("space-y-3", !embedded && "rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]")}>
      <DeviceCard
        device={line.device}
        onRemove={() => removeLine(line.lineId)}
        removeLabel={t("pos.removeLine")}
      />
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
