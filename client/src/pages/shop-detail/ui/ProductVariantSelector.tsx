import { Check } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { AssetImage } from "@/shared/ui/asset-image"
import { Button } from "@/shared/ui/button"
import type { StorefrontVariantView } from "@/entities/storefront"

export interface ProductVariantSelectorProps {
  variants: StorefrontVariantView[]
  selectedVariantIndex: number
  onSelectVariantIndex: (index: number) => void
  colorImages?: Record<string, string>
  showPrices?: boolean
}

export function ProductVariantSelector({
  variants,
  selectedVariantIndex,
  onSelectVariantIndex,
  colorImages,
  showPrices = true,
}: ProductVariantSelectorProps) {
  const { t } = useI18n()

  if (variants.length <= 1) {
    const single = variants[0]
    if (!single) return null
    const specs = Object.values(single.specs).filter(Boolean).join(" • ")
    if (!specs) return null

    return (
      <div className="space-y-1.5 pt-2">
        <span className="text-xs font-semibold text-muted-foreground block">
          {t("storefront.standardVariant")}
        </span>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-muted/50 border border-border text-xs font-medium text-foreground">
          <span>{specs}</span>
          {single.count > 0 && (
            <span className="text-[11px] text-emerald-500 font-semibold">
              ({single.count} {t("storefront.unitsCount")})
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground block">
          {t("storefront.selectVariant")}
        </label>
        <span className="text-[11px] text-muted-foreground font-medium">
          {variants.length} ta modifikatsiya
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {variants.map((v, idx) => {
          const isSelected = idx === selectedVariantIndex
          const color = typeof v.specs?.color === "string" ? v.specs.color : null
          const storage = typeof v.specs?.storage === "string" ? v.specs.storage : null
          const thumbUrl = color && colorImages?.[color]

          const otherSpecs = Object.entries(v.specs)
            .filter(([k]) => k !== "color" && k !== "storage")
            .map(([, val]) => String(val))
            .filter(Boolean)

          return (
            <Button
              key={idx}
              type="button"
              variant="outline"
              onClick={() => onSelectVariantIndex(idx)}
              className={`h-auto group relative flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-xs"
                  : "border-border/70 bg-card hover:border-foreground/30 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {thumbUrl ? (
                  <div className="size-10 rounded-xl bg-muted/60 overflow-hidden flex items-center justify-center shrink-0 border border-border/40 p-0.5">
                    <AssetImage
                      path={thumbUrl}
                      alt={color || "variant"}
                      className="size-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 border border-border/30 text-[11px] font-bold text-muted-foreground">
                    {storage || "—"}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
                    {storage && <span className="font-bold">{storage}</span>}
                    {color && <span className="text-muted-foreground font-normal">• {color}</span>}
                    {otherSpecs.length > 0 && (
                      <span className="text-muted-foreground font-normal">
                        • {otherSpecs.join(" ")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {showPrices && v.price && (
                      <span className="font-mono text-[11px] font-bold text-foreground tabular-nums">
                        {formatMoney(v.price)}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {v.count} {t("storefront.unitsCount")}
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-2 shadow-2xs">
                  <Check className="size-3 stroke-[3]" />
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
