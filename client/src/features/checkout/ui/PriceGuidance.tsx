import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"

export interface PriceGuidanceProps {
  salePrice: number
  targetPrice: string | null
  landedCost?: string
  canViewCost: boolean
  minMarginPercent: number
  belowCostConfirmed: boolean
  onPriceChange: (price: number) => void
  onBelowCostConfirmedChange: (confirmed: boolean) => void
}

function QuickPriceButtons({
  target,
  salePrice,
  onPriceChange,
}: {
  target: number | null
  salePrice: number
  onPriceChange: (price: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap gap-1.5">
      {target != null && (
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => onPriceChange(target)}>
          = {t("pos.quickTarget")}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onPriceChange(Math.round(salePrice * 0.95))}
      >
        -5%
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onPriceChange(Math.round(salePrice / 10) * 10)}
      >
        {t("pos.quickRound")}
      </Button>
    </div>
  )
}

function MarginRow({ margin, low }: { margin: number; low: boolean }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{t("pos.margin")}</span>
      <span className={low ? "font-bold text-red-600" : "font-semibold text-emerald-600"}>
        {margin.toFixed(1)}%
      </span>
    </div>
  )
}

export function PriceGuidance({
  salePrice,
  targetPrice,
  landedCost,
  canViewCost,
  minMarginPercent,
  belowCostConfirmed,
  onPriceChange,
  onBelowCostConfirmedChange,
}: PriceGuidanceProps) {
  const { t } = useI18n()
  const target = targetPrice ? Number(targetPrice) : null
  const cost = canViewCost && landedCost != null ? Number(landedCost) : null
  const belowTarget = target != null && salePrice < target
  const margin = cost != null && salePrice > 0 ? ((salePrice - cost) / salePrice) * 100 : null
  const belowCost = cost != null && salePrice < cost

  return (
    <div className="space-y-2 rounded-[10px] bg-[#f8f9fa] border border-[#e8e8e8] p-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("pos.targetPrice")}</span>
        <span className="font-semibold">{formatMoney(targetPrice)}</span>
      </div>
      {belowTarget && (
        <Badge variant="outline" size="sm" className="bg-amber-500/15 text-amber-600 border-amber-500/30">
          {t("pos.belowTarget")}
        </Badge>
      )}
      {margin != null && <MarginRow margin={margin} low={margin < minMarginPercent} />}
      <QuickPriceButtons target={target} salePrice={salePrice} onPriceChange={onPriceChange} />
      {belowCost && (
        <Label className="flex items-start gap-2 text-xs font-medium text-red-600 cursor-pointer pt-1">
          <Checkbox
            checked={belowCostConfirmed}
            onCheckedChange={(v) => onBelowCostConfirmedChange(Boolean(v))}
            className="mt-0.5"
          />
          <span>{t("pos.belowCostConfirm")}</span>
        </Label>
      )}
    </div>
  )
}
