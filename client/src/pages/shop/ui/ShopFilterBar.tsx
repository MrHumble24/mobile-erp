import { Search, X, SlidersHorizontal, Layers } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type {
  StorefrontStoreSummary,
  StorefrontCategorySummary,
} from "@/entities/storefront"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { SortOption } from "../lib/catalog"

interface ShopFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  stores: StorefrontStoreSummary[]
  selectedStore: string
  onStoreChange: (value: string) => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  categories: StorefrontCategorySummary[]
  totalCount: number | undefined
  selectedCategory: string | undefined
  onCategoryChange: (value: string | undefined) => void
  availableBrands: string[]
  selectedBrand: string
  onBrandChange: (value: string) => void
  filteredCount: number
  hasActiveFilters: boolean
  onClear: () => void
}

export function ShopFilterBar({
  search,
  onSearchChange,
  stores,
  selectedStore,
  onStoreChange,
  sortBy,
  onSortChange,
  categories,
  totalCount,
  selectedCategory,
  onCategoryChange,
  availableBrands,
  selectedBrand,
  onBrandChange,
  filteredCount,
  hasActiveFilters,
  onClear,
}: ShopFilterBarProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* Top Row: Search Input + Store + Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Live Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("storefront.searchPlaceholder")}
            className="pl-10 pr-9 h-11 rounded-full bg-card border-border/80 text-sm shadow-2xs"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 size-5 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Store & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Store Filter */}
          {stores.length > 1 && (
            <Select value={selectedStore} onValueChange={(v) => onStoreChange(v ?? "ALL")}>
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
          <Select value={sortBy} onValueChange={(v) => onSortChange((v as SortOption) ?? "featured")}>
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
          onClick={() => onCategoryChange(undefined)}
          className="rounded-full text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
        >
          <Layers className="size-3.5 mr-1" />
          <span>{t("storefront.allCategories")}</span>
          {totalCount !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-card/30">
              {totalCount}
            </span>
          )}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selectedCategory === cat.id ? "default" : "outline"}
            onClick={() => onCategoryChange(cat.id)}
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onBrandChange("ALL")}
            className={`h-auto rounded-full px-3 py-1 text-xs font-medium shrink-0 ${
              selectedBrand === "ALL"
                ? "bg-muted text-foreground font-bold shadow-2xs border border-border"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {t("storefront.allCategories")}
          </Button>
          {availableBrands.map((brand) => (
            <Button
              key={brand}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onBrandChange(brand)}
              className={`h-auto rounded-full px-3 py-1 text-xs font-medium shrink-0 ${
                selectedBrand === brand
                  ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
              }`}
            >
              {brand}
            </Button>
          ))}
        </div>
      )}

      {/* Active Filter Counter & Clear Button */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          {t("storefront.productsFound", { count: filteredCount })}
        </span>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onClear}
            className="h-auto p-0 font-semibold text-primary hover:underline"
          >
            {t("storefront.clearFilters")}
          </Button>
        )}
      </div>
    </div>
  )
}
