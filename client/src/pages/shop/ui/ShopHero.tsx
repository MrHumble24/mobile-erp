import {
  Sparkles,
  ArrowDown,
  Send,
  ShieldCheck,
  Smartphone,
  Truck,
  MapPin,
} from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { StorefrontProductCard } from "@/entities/storefront"
import { Button } from "@/shared/ui/button"
import { AssetImage } from "@/shared/ui/asset-image"
import { formatMoney } from "@/shared/lib/format"

interface ShopHeroProps {
  spotlightProduct: StorefrontProductCard | null
  telegramUrl: string
  onScrollToCatalog: () => void
  onQuickBuy: (product: StorefrontProductCard) => void
}

export function ShopHero({
  spotlightProduct,
  telegramUrl,
  onScrollToCatalog,
  onQuickBuy,
}: ShopHeroProps) {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-linear-to-b from-card via-card/90 to-background pt-8 pb-12 sm:pt-12 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <Sparkles className="size-3.5" />
              <span>{t("storefront.badgeOfficialWarranty")}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.12]">
              {t("storefront.heroTitle")}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              {t("storefront.heroSubtitle")}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={onScrollToCatalog}
                className="h-12 px-6 rounded-full font-bold text-sm gap-2 shadow-md cursor-pointer hover:scale-102 transition-transform"
              >
                <span>{t("storefront.heroCtaCatalog")}</span>
                <ArrowDown className="size-4 animate-bounce" />
              </Button>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full text-sm font-semibold border border-border/80 bg-card hover:border-primary/50 text-foreground hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                <Send className="size-4 text-sky-400" />
                <span>{t("storefront.heroCtaTelegram")}</span>
              </a>
            </div>

            {/* Quick Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-foreground">{t("storefront.trustWarrantyTitle")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-sky-400 shrink-0" />
                <span className="text-xs font-medium text-foreground">{t("storefront.trustImeiTitle")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium text-foreground">{t("storefront.trustDeliveryTitle")}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{t("storefront.trustStoreTitle")}</span>
              </div>
            </div>
          </div>

          {/* Right Hero Spotlight Card */}
          {spotlightProduct && (
            <div className="lg:col-span-5">
              <div
                onClick={() => onQuickBuy(spotlightProduct)}
                className="group relative rounded-[28px] border border-border bg-card p-6 shadow-xl transition-all hover:border-primary/50 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-xs">
                    <Sparkles className="size-3" />
                    {t("storefront.sortFeatured")}
                  </span>
                </div>

                <div className="aspect-4/3 w-full flex items-center justify-center p-4 relative overflow-hidden">
                  <AssetImage
                    path={spotlightProduct.imageUrl}
                    alt={spotlightProduct.name}
                    className="size-full object-contain group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                </div>

                <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                    {spotlightProduct.brand}
                  </span>
                  <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">
                    {spotlightProduct.name}
                  </h2>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {spotlightProduct.priceFrom && (
                        <div className="font-mono text-2xl font-black text-foreground">
                          {formatMoney(Number(spotlightProduct.priceFrom))}
                        </div>
                      )}
                      <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {spotlightProduct.inStock} {t("storefront.unitsCount")}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="rounded-full text-xs font-bold px-4 shadow-xs"
                    >
                      {t("storefront.quickBuy")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
