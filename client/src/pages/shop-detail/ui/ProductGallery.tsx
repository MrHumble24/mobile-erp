import * as React from "react"
import { Maximize2, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { AssetImage } from "@/shared/ui/asset-image"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

export interface ProductGalleryProps {
  productName: string
  activeImageUrl: string | null
  colorImages?: Record<string, string>
  selectedColor?: string
  onSelectColor?: (color: string) => void
  inStockCount: number
}

export function ProductGallery({
  productName,
  activeImageUrl,
  colorImages,
  selectedColor,
  onSelectColor,
  inStockCount,
}: ProductGalleryProps) {
  const { t } = useI18n()
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  const colorEntries = React.useMemo(() => {
    if (!colorImages) return []
    return Object.entries(colorImages).filter(([, url]) => Boolean(url))
  }, [colorImages])

  return (
    <div className="space-y-4">
      {/* Main Image Showcase */}
      <div className="relative aspect-square w-full rounded-[26px] bg-gradient-to-b from-muted/20 via-muted/40 to-muted/20 border border-border/70 overflow-hidden flex items-center justify-center p-6 sm:p-8 group shadow-xs">
        {/* Floating Stock Badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          {inStockCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{inStockCount} {t("storefront.unitsCount")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 backdrop-blur-md">
              {t("storefront.outOfStock")}
            </span>
          )}
        </div>

        {/* Zoom Lightbox Trigger */}
        <div className="absolute top-3.5 right-3.5 z-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLightboxOpen(true)}
            aria-label={t("storefront.clickToEnlarge")}
            className="size-9 p-0 rounded-full bg-card/85 backdrop-blur-md border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs transition-all"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>

        {/* Product Photo */}
        <AssetImage
          path={activeImageUrl}
          alt={productName}
          className="size-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out select-none"
        />
      </div>

      {/* Color Thumbnails Strip */}
      {colorEntries.length > 1 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              {t("storefront.color")}:{" "}
              <span className="text-foreground font-semibold">
                {selectedColor || colorEntries[0]?.[0]}
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {colorEntries.length} rang mavjud
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {colorEntries.map(([color, imgUrl]) => {
              const isSelected = selectedColor === color
              return (
                <Button
                  key={color}
                  type="button"
                  variant="outline"
                  onClick={() => onSelectColor?.(color)}
                  className={`h-auto group relative flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25 shadow-xs"
                      : "border-border/70 bg-card hover:border-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="size-14 sm:size-16 rounded-xl bg-muted/40 overflow-hidden flex items-center justify-center p-1 border border-border/40">
                    <AssetImage
                      path={imgUrl}
                      alt={color}
                      className="size-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium max-w-16 truncate text-center transition-colors ${
                      isSelected ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {color}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Lightbox Preview Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogPopup className="max-w-3xl p-4 sm:p-6 bg-card border-border">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <DialogTitle className="text-base sm:text-lg font-bold">
              {productName} {selectedColor ? `— ${selectedColor}` : ""}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLightboxOpen(false)}
              className="size-8 p-0 rounded-full cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          </DialogHeader>
          <div className="aspect-square max-h-[70vh] w-full flex items-center justify-center p-4">
            <AssetImage
              path={activeImageUrl}
              alt={productName}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
