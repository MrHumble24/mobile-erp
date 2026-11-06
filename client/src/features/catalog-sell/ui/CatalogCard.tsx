import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { AssetImage } from "@/shared/ui/asset-image"
import type { CatalogEntry } from "@/entities/catalog"
import type { LevelCode } from "@/entities/pricing"

function priceLabel(entry: CatalogEntry, level: LevelCode): string {
  // The resolved price for the current level wins when set (ADR 0034).
  const levelPrice = entry.prices?.[level]
  if (levelPrice != null) return formatMoney(levelPrice)
  if (entry.kindCode === "QUANTITY") return formatMoney(entry.salePrice)
  const { minTargetPrice: min, maxTargetPrice: max } = entry
  if (min == null) return "-"
  if (max == null || min === max) return formatMoney(min)
  return `${formatMoney(min)} – ${formatMoney(max)}`
}

/** One tappable product card: picture, name, stock count and price. */
export function CatalogCard({ entry, level, onTap }: { entry: CatalogEntry; level: LevelCode; onTap: () => void }) {
  const { t } = useI18n()
  const low = entry.inStock <= 0
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onTap}
      className="h-auto w-full flex-col items-stretch gap-0 overflow-hidden whitespace-normal rounded-[16px] border border-border bg-white p-0 text-left shadow-[var(--shadow-xs)] hover:bg-muted"
    >
      <AssetImage path={entry.imageUrl} alt={entry.name} className="aspect-square w-full" />
      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-semibold text-foreground">
          {entry.brand} {entry.name}
        </span>
        <span className={cn("text-xs", low ? "text-red-600" : "text-muted-foreground")}>
          {t("catalog.inStockCount", { count: entry.inStock })}
        </span>
        <span className="mt-auto pt-1 text-sm font-bold text-primary">{priceLabel(entry, level)}</span>
      </span>
    </Button>
  )
}
