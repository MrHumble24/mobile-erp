import { Tag } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { usePriceLevels, type LevelCode } from "@/entities/pricing"
import { useCartStore } from "../model/cart.store"

/** Map a level code to its `pricing` i18n key; falls back to the server label. */
function levelKey(code: string): string | null {
  if (code === "RETAIL") return "pricing.levelRetail"
  if (code === "WHOLESALE") return "pricing.levelWholesale"
  if (code === "PARTNER") return "pricing.levelPartner"
  return null
}

/**
 * The price-level control (ADR 0034): follows the chosen customer's type,
 * defaults to walk-in, and the seller may switch it. Changing it re-prices every
 * line (prices are derived from the level in the cart store).
 */
export function PriceLevelControl() {
  const { t } = useI18n()
  const { data: levels } = usePriceLevels()
  const level = useCartStore((s) => s.priceLevelCode)
  const setPriceLevel = useCartStore((s) => s.setPriceLevel)
  if (!levels || levels.length === 0) return null

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <Tag className="size-3.5" />
        {t("pricing.priceLevel")}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {levels.map((l) => {
          const key = levelKey(l.code)
          return (
            <Button
              key={l.code}
              type="button"
              size="sm"
              variant={level === l.code ? "default" : "outline"}
              className="h-9 text-xs"
              onClick={() => setPriceLevel(l.code as LevelCode)}
            >
              {key ? t(key) : l.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
