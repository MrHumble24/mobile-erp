import * as React from "react"
import { Search, Store, PackageX } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useStorefrontConfig, useStorefrontProducts } from "@/entities/storefront"
import { StorefrontHeader } from "@/widgets/storefront-header"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { ShopProductCard } from "./ShopProductCard"

export function ShopPage() {
  const { t } = useI18n()
  const { data: config, isLoading: configLoading } = useStorefrontConfig()

  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined)

  const { data: products, isLoading: productsLoading } = useStorefrontProducts({
    categoryId: selectedCategory,
    search: search.trim() || undefined,
  })

  if (configLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="h-16 border-b border-border bg-card" />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-full max-w-md rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-3/4 rounded-2xl" />
            ))}
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

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <StorefrontHeader
        shopName={config.shopName}
        contactPhone={config.contactPhone}
        contactTelegram={config.contactTelegram}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Search bar */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("storefront.searchPlaceholder")}
            className="pl-10 h-11 rounded-full bg-card border-border shadow-xs"
          />
        </div>

        {/* Category filter chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
              size="sm"
              variant={selectedCategory === undefined ? "default" : "outline"}
              onClick={() => setSelectedCategory(undefined)}
              className="rounded-full text-xs font-semibold shrink-0"
            >
              {t("storefront.allCategories")}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="rounded-full text-xs font-semibold shrink-0"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-3/4 rounded-2xl" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <PackageX className="size-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{t("storefront.outOfStock")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ShopProductCard
                key={p.modelId}
                product={p}
                showPrices={config.showPrices}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default ShopPage
