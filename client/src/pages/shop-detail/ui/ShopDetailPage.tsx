import * as React from "react"
import { useParams } from "react-router"
import { ArrowLeft, MapPin, Store, PackageX } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useStorefrontConfig, useStorefrontProduct, type StorefrontVariantView } from "@/entities/storefront"
import { StorefrontHeader } from "@/widgets/storefront-header"
import { StorefrontOrderModal } from "@/features/storefront-order"
import { AssetImage } from "@/shared/ui/asset-image"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { Link } from "@/shared/ui/link"

export function ShopDetailPage() {
  const { modelId } = useParams<{ modelId: string }>()
  const { t } = useI18n()
  const { data: config, isLoading: configLoading } = useStorefrontConfig()
  const { data: product, isLoading: productLoading, error: productError } = useStorefrontProduct(modelId ?? "")

  const [selectedVariantIndex, setSelectedVariantIndex] = React.useState<number>(0)
  const [orderModalOpen, setOrderModalOpen] = React.useState(false)

  if (configLoading || productLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="h-16 border-b border-border bg-card" />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-32 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!config?.enabled) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center px-4">
          <div className="max-w-6xl mx-auto w-full flex items-center gap-2">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
              <Store className="size-4 text-muted-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">Malika Store</span>
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
          shopName={config.shopName}
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

  const priceDisplay =
    config.showPrices && selectedVariant?.price
      ? formatMoney(selectedVariant.price)
      : config.showPrices && product.priceFrom
        ? `${t("storefront.fromPrice")} ${formatMoney(product.priceFrom)}`
        : t("storefront.ask")

  const availableStores = selectedVariant?.stores
    ? selectedVariant.stores.filter((st) => st.count > 0).map((st) => ({ id: st.id, name: st.name }))
    : product.stores.map((st) => ({ id: st.id, name: st.name }))

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <StorefrontHeader
        shopName={config.shopName}
        contactPhone={config.contactPhone}
        contactTelegram={config.contactTelegram}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <ArrowLeft className="size-4" />
          <span>{t("storefront.backToCatalog")}</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-card p-5 sm:p-8 rounded-3xl border border-border">
          {/* Image */}
          <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center p-6 overflow-hidden">
            <AssetImage
              path={product.imageUrl}
              alt={product.name}
              className="size-full object-contain"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {product.brand}
                </span>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div className="font-display font-bold text-2xl sm:text-3xl text-foreground whitespace-nowrap tabular-nums">
                {priceDisplay}
              </div>

              {/* Variants */}
              {variants.length > 1 && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    {t("storefront.selectVariant")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v, idx) => {
                      const specValues = Object.values(v.specs).filter(Boolean)
                      const specSummary =
                        specValues.length > 0
                          ? specValues.join(" • ")
                          : product.name || t("storefront.standardVariant") || "Standard"
                      const isSelected = idx === selectedVariantIndex
                      return (
                        <Button
                          key={idx}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedVariantIndex(idx)}
                          className="h-auto flex flex-col items-start p-2 rounded-xl text-left"
                        >
                          <div className="font-semibold text-xs">{specSummary}</div>
                          {config.showPrices && v.price && (
                            <div className="text-[10px] opacity-80 tabular-nums">
                              {formatMoney(v.price)}
                            </div>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Stock in branches */}
              <div className="space-y-2 pt-3 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground">
                  {t("storefront.availableBranches")}
                </div>
                <div className="space-y-1.5">
                  {(selectedVariant?.stores ?? []).map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted border border-border"
                    >
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        {st.name}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {st.count} {t("storefront.unitsCount")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => setOrderModalOpen(true)}
                disabled={availableStores.length === 0}
                className="w-full rounded-2xl h-12 text-sm font-semibold shadow-md"
              >
                {t("storefront.orderNow")}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <StorefrontOrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        modelId={product.modelId}
        modelName={product.name}
        variantSpecs={selectedVariant?.specs}
        availableStores={availableStores}
        shopPhone={config.contactPhone}
      />
    </div>
  )
}

export default ShopDetailPage
