import * as React from "react"
import { useNavigate } from "react-router"
import { MapPin, ShoppingBag, ArrowRight } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { AssetImage } from "@/shared/ui/asset-image"
import { Button } from "@/shared/ui/button"
import type { StorefrontProductCard as ProductCardType } from "@/entities/storefront"

export interface ShopProductCardProps {
  product: ProductCardType
  showPrices?: boolean
  onQuickBuy?: (product: ProductCardType) => void
}

export function ShopProductCard({
  product,
  showPrices = true,
  onQuickBuy,
}: ShopProductCardProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const priceNum = product.priceFrom ? Number(product.priceFrom) : null
  const monthlyNum = priceNum && priceNum > 0 ? Math.round(priceNum / 12) : null

  const handleCardClick = () => {
    navigate(`/shop/${product.modelId}`)
  }

  const handleQuickBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onQuickBuy) {
      onQuickBuy(product)
    } else {
      navigate(`/shop/${product.modelId}`)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between bg-card rounded-[22px] border border-border/80 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    >
      {/* Top Image Showcase */}
      <div className="aspect-4/3 w-full bg-muted/40 relative overflow-hidden flex items-center justify-center p-6 border-b border-border/40">
        <AssetImage
          path={product.imageUrl}
          alt={product.name}
          className="size-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
        />

        {/* Brand Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-card/90 text-foreground border border-border/60 shadow-2xs backdrop-blur-xs">
            {product.brand}
          </span>
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {product.inStock > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-2xs backdrop-blur-xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{product.inStock} {t("storefront.unitsCount")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {t("storefront.outOfStock")}
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {product.categoryName && (
            <span className="text-[11px] font-medium text-muted-foreground block mb-1">
              {product.categoryName}
            </span>
          )}
          <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Price & Installment */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {showPrices && priceNum !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-muted-foreground font-normal">
                    {t("storefront.fromPrice")}
                  </span>
                  <span className="font-mono text-xl font-extrabold text-foreground tracking-tight tabular-nums">
                    {formatMoney(priceNum)}
                  </span>
                </div>
              ) : (
                <span className="font-display text-sm font-semibold text-muted-foreground">
                  {t("storefront.ask")}
                </span>
              )}
            </div>

            {monthlyNum && (
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {t("storefront.monthlyInstallment", { amount: formatMoney(monthlyNum) })}
              </span>
            )}
          </div>

          {/* Store Availability */}
          <div className="flex flex-wrap gap-1 items-center pt-1">
            {product.stores.map((st) => (
              <span
                key={st.id}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40"
              >
                <MapPin className="size-3 text-emerald-500" />
                <span>{st.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleQuickBuyClick}
            className="flex-1 h-9 rounded-full text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="size-3.5" />
            <span>{t("storefront.quickBuy")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCardClick}
            className="h-9 px-3 rounded-full text-xs font-medium border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>{t("storefront.viewDetails")}</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
