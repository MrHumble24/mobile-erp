import * as React from "react"
import { Store, PackageX } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useBranding } from "@/entities/company"
import {
  useStorefrontConfig,
  useStorefrontProducts,
  useStorefrontProduct,
  type StorefrontProductCard as ProductCardType,
} from "@/entities/storefront"
import { StorefrontHeader } from "@/widgets/storefront-header"
import { StorefrontOrderModal } from "@/features/storefront-order"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { ShopProductCard } from "./ShopProductCard"
import { ShopHero } from "./ShopHero"
import { ShopFilterBar } from "./ShopFilterBar"
import { ShopTrustSection } from "./ShopTrustSection"
import {
  extractBrands,
  filterAndSortProducts,
  pickSpotlight,
  type SortOption,
} from "../lib/catalog"

export function ShopPage() {
  const { t } = useI18n()
  const { data: branding } = useBranding()
  const { data: config, isLoading: configLoading } = useStorefrontConfig()

  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined)
  const [selectedBrand, setSelectedBrand] = React.useState<string>("ALL")
  const [selectedStore, setSelectedStore] = React.useState<string>("ALL")
  const [sortBy, setSortBy] = React.useState<SortOption>("featured")

  // 1-Click Quick Order Modal State
  const [quickBuyProduct, setQuickBuyProduct] = React.useState<ProductCardType | null>(null)
  const quickProductQuery = useStorefrontProduct(quickBuyProduct?.modelId ?? "")

  const catalogRef = React.useRef<HTMLDivElement>(null)

  const { data: rawProducts, isLoading: productsLoading } = useStorefrontProducts({
    categoryId: selectedCategory,
    search: search.trim() || undefined,
  })

  const availableBrands = React.useMemo(() => extractBrands(rawProducts ?? []), [rawProducts])

  const filteredProducts = React.useMemo(
    () =>
      filterAndSortProducts(rawProducts ?? [], {
        brand: selectedBrand,
        store: selectedStore,
        sort: sortBy,
      }),
    [rawProducts, selectedBrand, selectedStore, sortBy]
  )

  const spotlightProduct = React.useMemo(() => pickSpotlight(rawProducts ?? []), [rawProducts])

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory(undefined)
    setSelectedBrand("ALL")
    setSelectedStore("ALL")
  }

  if (configLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b border-border bg-card" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-[24px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-3/4 rounded-[22px]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!config?.enabled) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center px-4">
          <div className="max-w-6xl mx-auto w-full flex items-center gap-2">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
              <Store className="size-4 text-muted-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">{branding?.name}</span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <PackageX className="size-8 text-muted-foreground" />
          </div>
          <h1 className="font-display font-bold text-xl text-foreground mb-2">
            {t("storefront.notAvailable")}
          </h1>
        </div>
      </div>
    )
  }

  const categories = config.categories ?? []
  const stores = config.stores ?? []
  const telegramUrl = config.contactTelegram
    ? config.contactTelegram.startsWith("http")
      ? config.contactTelegram
      : `https://t.me/${config.contactTelegram.replace(/^@/, "")}`
    : "https://t.me/tmobile_malika"
  const hasActiveFilters =
    Boolean(search) || Boolean(selectedCategory) || selectedBrand !== "ALL" || selectedStore !== "ALL"

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* 1. Elevated Storefront Header */}
      <StorefrontHeader
        contactPhone={config.contactPhone}
        contactTelegram={config.contactTelegram}
      />

      {/* 2. Hero Showcase Section */}
      <ShopHero
        spotlightProduct={spotlightProduct}
        telegramUrl={telegramUrl}
        onScrollToCatalog={scrollToCatalog}
        onQuickBuy={setQuickBuyProduct}
      />

      {/* 3. Main Catalog Section */}
      <main ref={catalogRef} className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        <ShopFilterBar
          search={search}
          onSearchChange={setSearch}
          stores={stores}
          selectedStore={selectedStore}
          onStoreChange={setSelectedStore}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
          totalCount={rawProducts?.length}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          availableBrands={availableBrands}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          filteredCount={filteredProducts.length}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />

        {/* Product Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-3/4 rounded-[22px]" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-[24px] border border-dashed border-border bg-card/60 p-8">
            <PackageX className="size-14 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="text-base font-bold text-foreground mb-1">
              {t("storefront.outOfStock")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Qidiruv shartlariga mos keluvchi mahsulotlar topilmadi. Filtrlarni tozalab koʻring.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="rounded-full text-xs font-semibold"
            >
              {t("storefront.clearFilters")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => (
              <ShopProductCard
                key={p.modelId}
                product={p}
                showPrices={config.showPrices}
                onQuickBuy={(prod) => setQuickBuyProduct(prod)}
              />
            ))}
          </div>
        )}

        {/* 4. Physical Storefront & Trust Section */}
        <ShopTrustSection
          contactPhone={config.contactPhone}
          contactTelegram={config.contactTelegram}
          telegramUrl={telegramUrl}
        />
      </main>

      {/* 5. Clean Storefront Footer */}
      <footer className="mt-16 border-t border-border bg-card/60 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-foreground">
              {branding?.name || "T-Mobile"}
            </span>
            <span>—</span>
            <span>{t("storefront.storeLocationDesc")}</span>
          </div>

          <div className="flex items-center gap-4">
            <a href={telegramUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
              Telegram
            </a>
            <a href={`tel:${config.contactPhone || "+998 90 999 88 77"}`} className="hover:text-primary transition-colors">
              {t("storefront.contactPhone")}
            </a>
          </div>
        </div>
      </footer>

      {/* 1-Click Quick Order Modal */}
      {quickBuyProduct && (
        <StorefrontOrderModal
          open={Boolean(quickBuyProduct)}
          onOpenChange={(open) => !open && setQuickBuyProduct(null)}
          modelId={quickBuyProduct.modelId}
          modelName={quickBuyProduct.name}
          variantSpecs={quickProductQuery.data?.variants[0]?.specs}
          availableStores={
            quickProductQuery.data?.variants[0]?.stores
              ? quickProductQuery.data.variants[0].stores
                  .filter((s) => s.count > 0)
                  .map((s) => ({ id: s.id, name: s.name }))
              : quickBuyProduct.stores
          }
          shopPhone={config.contactPhone}
          productPrice={
            quickProductQuery.data?.variants[0]?.price
              ? Number(quickProductQuery.data.variants[0].price)
              : quickBuyProduct.priceFrom
                ? Number(quickBuyProduct.priceFrom)
                : null
          }
        />
      )}
    </div>
  )
}

export default ShopPage
