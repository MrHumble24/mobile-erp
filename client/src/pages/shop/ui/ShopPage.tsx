import * as React from "react"
import {
  Search,
  Store,
  PackageX,
  ShieldCheck,
  Smartphone,
  Truck,
  MapPin,
  Sparkles,
  ArrowDown,
  Send,
  X,
  SlidersHorizontal,
  Phone,
  Clock,
  Layers,
} from "lucide-react"
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
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { AssetImage } from "@/shared/ui/asset-image"
import { formatMoney } from "@/shared/lib/format"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { ShopProductCard } from "./ShopProductCard"

type SortOption = "featured" | "price_asc" | "price_desc" | "stock_desc"

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

  // Extract unique brands for brand pills
  const availableBrands = React.useMemo(() => {
    if (!rawProducts) return []
    const brands = new Set<string>()
    rawProducts.forEach((p) => {
      if (p.brand) brands.add(p.brand)
    })
    return Array.from(brands).sort()
  }, [rawProducts])

  // Filter & Sort Products locally for instant responsiveness
  const filteredProducts = React.useMemo(() => {
    if (!rawProducts) return []
    let list = [...rawProducts]

    // Brand filter
    if (selectedBrand !== "ALL") {
      list = list.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase())
    }

    // Store filter
    if (selectedStore !== "ALL") {
      list = list.filter((p) => p.stores.some((st) => st.id === selectedStore))
    }

    // Sorting
    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => Number(a.priceFrom ?? 0) - Number(b.priceFrom ?? 0))
        break
      case "price_desc":
        list.sort((a, b) => Number(b.priceFrom ?? 0) - Number(a.priceFrom ?? 0))
        break
      case "stock_desc":
        list.sort((a, b) => b.inStock - a.inStock)
        break
      case "featured":
      default:
        // Prioritize in-stock and flagship brands
        list.sort((a, b) => {
          if (b.inStock > 0 && a.inStock === 0) return 1
          if (a.inStock > 0 && b.inStock === 0) return -1
          return a.name.localeCompare(b.name)
        })
        break
    }

    return list
  }, [rawProducts, selectedBrand, selectedStore, sortBy])

  // Top featured spotlight product for hero showcase
  const spotlightProduct = React.useMemo(() => {
    if (!rawProducts || rawProducts.length === 0) return null
    return (
      rawProducts.find((p) => p.name.includes("18") || p.name.includes("17") || p.name.includes("S25")) ??
      rawProducts[0]
    )
  }, [rawProducts])

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" })
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

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* 1. Elevated Storefront Header */}
      <StorefrontHeader
        contactPhone={config.contactPhone}
        contactTelegram={config.contactTelegram}
      />

      {/* 2. Hero Showcase Section ("The Face of Store") */}
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
                  onClick={scrollToCatalog}
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
                  onClick={() => setQuickBuyProduct(spotlightProduct)}
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

      {/* 3. Main Catalog Section */}
      <main ref={catalogRef} className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Search, Filter & Discovery Bar */}
        <div className="space-y-4">
          {/* Top Row: Search Input + Store + Sort controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("storefront.searchPlaceholder")}
                className="pl-10 pr-9 h-11 rounded-full bg-card border-border/80 text-sm shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Store & Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Store Filter */}
              {stores.length > 1 && (
                <Select value={selectedStore} onValueChange={(v) => setSelectedStore(v ?? "ALL")}>
                  <SelectTrigger className="h-10 text-xs rounded-full min-w-[130px] bg-card border-border/80">
                    <SelectValue placeholder={t("storefront.allStores")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("storefront.allStores")}</SelectItem>
                    {stores.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortOption) ?? "featured")}>
                <SelectTrigger className="h-10 text-xs rounded-full min-w-[150px] bg-card border-border/80">
                  <SlidersHorizontal className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{t("storefront.sortFeatured")}</SelectItem>
                  <SelectItem value="price_asc">{t("storefront.sortPriceAsc")}</SelectItem>
                  <SelectItem value="price_desc">{t("storefront.sortPriceDesc")}</SelectItem>
                  <SelectItem value="stock_desc">{t("storefront.sortStockDesc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Button
              size="sm"
              variant={selectedCategory === undefined ? "default" : "outline"}
              onClick={() => setSelectedCategory(undefined)}
              className="rounded-full text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
            >
              <Layers className="size-3.5 mr-1" />
              <span>{t("storefront.allCategories")}</span>
              {rawProducts && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-card/30">
                  {rawProducts.length}
                </span>
              )}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="rounded-full text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Brand Filter Pills */}
          {availableBrands.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">
                {t("storefront.filterAllBrands")}:
              </span>
              <button
                type="button"
                onClick={() => setSelectedBrand("ALL")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedBrand === "ALL"
                    ? "bg-muted text-foreground font-bold shadow-2xs border border-border"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {t("storefront.allCategories")}
              </button>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedBrand === brand
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}

          {/* Active Filter Counter & Clear Button */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              {t("storefront.productsFound", { count: filteredProducts.length })}
            </span>
            {(search || selectedCategory || selectedBrand !== "ALL" || selectedStore !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setSelectedCategory(undefined)
                  setSelectedBrand("ALL")
                  setSelectedStore("ALL")
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                {t("storefront.clearFilters")}
              </button>
            )}
          </div>
        </div>

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
              onClick={() => {
                setSearch("")
                setSelectedCategory(undefined)
                setSelectedBrand("ALL")
                setSelectedStore("ALL")
              }}
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
        <section className="mt-16 rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-xs)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location */}
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-foreground">
                  {t("storefront.storeLocationTitle")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("storefront.storeLocationDesc")}
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Clock className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-foreground">
                  {t("storefront.openHours")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dam olish kunlarisiz, soat 09:00 dan 20:00 gacha xizmatingizdamiz.
                </p>
              </div>
            </div>

            {/* Fast Contact */}
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <Phone className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-foreground">
                  {t("storefront.contactPhone")}
                </h4>
                <p className="text-xs text-muted-foreground font-mono">
                  {config.contactPhone || "+998 90 999 88 77"}
                </p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline inline-block mt-0.5"
                >
                  Telegram: {config.contactTelegram || "@tmobile_malika"}
                </a>
              </div>
            </div>
          </div>
        </section>
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
