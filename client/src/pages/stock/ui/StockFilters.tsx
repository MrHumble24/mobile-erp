import { useI18n } from "@/shared/i18n"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useProductCategories } from "@/entities/product-category"
import type { StockBrowser } from "../model/use-stock-browser"

const ALL = "__all__"

export function StockFilters({ browser }: { browser: StockBrowser }) {
  const { t } = useI18n()
  const { data: categories } = useProductCategories()

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
      <div className="sm:col-span-8">
        <BarcodeInput
          value={browser.searchInput}
          onChange={(e) => browser.setSearchInput(e.target.value)}
          onScan={(code) => browser.setSearchInput(code)}
          onClear={() => browser.setSearchInput("")}
          placeholder={t("catalog.scanCode")}
          className="h-10 bg-white border-border shadow-[var(--shadow-xs)]"
        />
      </div>
      <div className="sm:col-span-4">
        <Select
          value={browser.categoryId ?? ALL}
          onValueChange={(v) => browser.setCategoryId(!v || v === ALL ? undefined : v)}
        >
          <SelectTrigger className="h-10 bg-white border-border shadow-[var(--shadow-xs)]">
            <SelectValue placeholder={t("catalog.allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("catalog.allCategories")}</SelectItem>
            {(categories ?? [])
              .filter((c) => c.isActive || c.id === browser.categoryId)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
