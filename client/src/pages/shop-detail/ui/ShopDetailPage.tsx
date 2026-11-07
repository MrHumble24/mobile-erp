import * as React from "react"
import { useParams } from "react-router"
import { ArrowLeft, ShoppingBag, Store, PackageX } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useBranding } from "@/entities/company"
import {
  useStorefrontConfig,
  useStorefrontProduct,
  type StorefrontVariantView,
} from "@/entities/storefront"
import { StorefrontHeader } from "@/widgets/storefront-header"
import { StorefrontOrderModal } from "@/features/storefront-order"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"

import { ProductGallery } from "./ProductGallery"
import { ProductVariantSelector } from "./ProductVariantSelector"
import { ProductStoreAvailability } from "./ProductStoreAvailability"
import { ProductTrustBadges } from "./ProductTrustBadges"
import { ShopDetailSkeleton } from "./ShopDetailSkeleton"

export function ShopDetailPage() {
  const { modelId } = useParams<{ modelId: string }>()
  const { t } = useI18n()
  const { data: branding } = useBranding()
  const { data: config, isLoading: configLoading } = useStorefrontConfig()
  const { data: product, isLoading: productLoading, error: productError } = useStorefrontProduct(modelId ?? "")

  const [selectedVariantIndex, setSelectedVariantIndex] = React.useState<number>(0)
  const [orderModalOpen, setOrderModalOpen] = React.useState(false)

  if (configLoading || productLoading) {
    return <ShopDetailSkeleton />
  }

  if (!config?.enabled) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center px-4">
          <div className="max-w-6xl mx-auto w-full flex items-center gap-2">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
              <Store className="size-4 text-muted-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">{branding?.name}</span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <PackageX className="size-12 text-muted-foreground mb-4" />
          <h1 className="font-display font-bold text-xl text-foreground mb-2">
            {t("storefront.notAvailable")}
          </h1>
        </div>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <StorefrontHeader
          contactPhone={config.contactPhone}
          contactTelegram={config.contactTelegram}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <PackageX className="size-12 text-muted-foreground mb-4" />
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            {t("storefront.outOfStock")}
          </h2>
          <Button variant="outline" className="mt-4 rounded-full" render={<Link to="/shop" />}>
            <ArrowLeft className="size-4 mr-2" />
            {t("storefront.backToCatalog")}
          </Button>
        </div>
      </div>
    )
  }

  const variants = product.variants ?? []
  const selectedVariant: StorefrontVariantView | undefined = variants[selectedVariantIndex] ?? variants[0]

  const activePriceNum = selectedVariant?.price
    ? Number(selectedVariant.price)
    : product.priceFrom
      ? Number(product.priceFrom)
      : null

  const priceDisplay =
    config.showPrices && selectedVariant?.price
      ? formatMoney(selectedVariant.price)
      : config.showPrices && product.priceFrom
        ? `${t("storefront.fromPrice")} ${formatMoney(product.priceFrom)}`
        : t("storefront.ask")

  const monthlyInstallment =
    config.showPrices && activePriceNum && activePriceNum > 0
      ? Math.round(activePriceNum / 12)
      : null

  const availableStores = selectedVariant?.stores
    ? selectedVariant.stores.filter((st) => st.count > 0).map((st) => ({ id: st.id, name: st.name, count: st.count }))
    : product.stores.map((st) => ({ id: st.id, name: st.name }))

  const selectedVariantColor = typeof selectedVariant?.specs?.color === "string" ? selectedVariant.specs.color : undefined
  const fallbackColorImage = product.colorImages ? Object.values(product.colorImages)[0] : null
  const activeImageUrl =
    (selectedVariantColor && product.colorImages?.[selectedVariantColor]) ||
    product.imageUrl ||
    fallbackColorImage

  const fullProductName =
    product.brand && !product.name.toLowerCase().startsWith(product.brand.toLowerCase())
      ? `${product.brand} ${product.name}`
      : product.name

  const handleSelectColor = (colorName: string) => {
    const targetIdx = variants.findIndex(
      (v) => typeof v.specs?.color === "string" && v.specs.color.toLowerCase() === colorName.toLowerCase()
    )
    if (targetIdx !== -1) {
      setSelectedVariantIndex(targetIdx)
    }
  }

  const isBuyDisabled = availableStores.length === 0 || (selectedVariant && selectedVariant.count <= 0)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StorefrontHeader
        contactPhone={config.contactPhone}
        contactTelegram={config.contactTelegram}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 sm:pb-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors no-underline font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>{t("storefront.catalog")}</span>
          </Link>
          <span className="text-border">/</span>
          {product.categoryName && (
            <>
              <span className="hover:text-foreground transition-colors">{product.categoryName}</span>
              <span className="text-border">/</span>
            </>
          )}
          <span className="text-foreground font-semibold truncate max-w-xs sm:max-w-md">
            {fullProductName}
          </span>
        </nav>

        {/* Product Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 bg-card p-6 sm:p-8 lg:p-10 rounded-[28px] border border-border shadow-[var(--shadow-xs)]">
          {/* Left Column: Visual Showcase & Color Thumbnails */}
          <ProductGallery
            productName={fullProductName}
            activeImageUrl={activeImageUrl}
            colorImages={product.colorImages}
            selectedColor={selectedVariantColor}
            onSelectColor={handleSelectColor}
            inStockCount={selectedVariant?.count ?? product.inStock}
          />

          {/* Right Column: Information, Variants & Actions */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Product Title */}
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight leading-tight">
                  {fullProductName}
                </h1>
              </div>

              {/* Price & Installment Badge */}
              <div className="flex flex-wrap items-baseline gap-3 pb-2 border-b border-border/70">
                <div className="font-mono font-black text-3xl sm:text-4xl text-foreground tabular-nums tracking-tight">
                  {priceDisplay}
                </div>
                {monthlyInstallment && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {t("storefront.monthlyInstallment", { amount: formatMoney(monthlyInstallment) })}
                  </span>
                )}
              </div>

              {/* Variant Selector */}
              <ProductVariantSelector
                variants={variants}
                selectedVariantIndex={selectedVariantIndex}
                onSelectVariantIndex={setSelectedVariantIndex}
                colorImages={product.colorImages}
                showPrices={config.showPrices}
              />

              {/* Store Availability */}
              <ProductStoreAvailability stores={availableStores} />

              {/* Reassurance & Value Props */}
              <ProductTrustBadges />
            </div>

            {/* Desktop CTA Button */}
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => setOrderModalOpen(true)}
                disabled={isBuyDisabled}
                className="w-full rounded-2xl h-13 text-sm font-bold shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
              >
                <ShoppingBag className="size-4.5" />
                <span>
                  {t("storefront.orderNow")}
                  {config.showPrices && activePriceNum ? ` • ${formatMoney(activePriceNum)}` : ""}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-md border-t border-border p-3 px-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <div className="font-mono font-bold text-lg text-foreground tabular-nums truncate">
            {priceDisplay}
          </div>
          {selectedVariant && (
            <div className="text-[11px] text-muted-foreground truncate">
              {Object.values(selectedVariant.specs).filter(Boolean).join(" • ")}
            </div>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setOrderModalOpen(true)}
          disabled={isBuyDisabled}
          className="rounded-xl h-11 px-5 text-xs font-bold shrink-0 shadow-sm cursor-pointer"
        >
          <ShoppingBag className="size-4 mr-1.5" />
          <span>{t("storefront.orderNow")}</span>
        </Button>
      </div>

      {/* Order Modal */}
      <StorefrontOrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        modelId={product.modelId}
        modelName={fullProductName}
        variantSpecs={selectedVariant?.specs}
        availableStores={availableStores}
        shopPhone={config.contactPhone}
        productPrice={activePriceNum}
      />
    </div>
  )
}

export default ShopDetailPage
