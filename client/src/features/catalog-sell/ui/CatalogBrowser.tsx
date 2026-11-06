import * as React from "react"
import { Search } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { Input } from "@/shared/ui/input"
import { Skeleton } from "@/shared/ui/skeleton"
import type { LevelCode } from "@/entities/pricing"
import { useCatalog, type CatalogEntry, type CatalogUnit } from "@/entities/catalog"
import { CatalogCard } from "./CatalogCard"
import { CategoryChips } from "./CategoryChips"
import { UnitPickerSheet } from "./UnitPickerSheet"
import { useCatalogPick } from "../model/use-catalog-pick"

export interface CatalogBrowserProps {
  /** The price level the cards show (ADR 0034). */
  level: LevelCode
  /** Unit ids already in the cart — those units are not offered again. */
  excludeUnitIds: Set<string>
  onPickUnit: (unit: CatalogUnit, entry: CatalogEntry) => void
  onPickQuantity: (entry: CatalogEntry) => void
}

/** Catalog till mode: search + category chips + a tappable product grid. */
export function CatalogBrowser({ level, excludeUnitIds, onPickUnit, onPickQuantity }: CatalogBrowserProps) {
  const { t } = useI18n()
  const [search, setSearch] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined)
  const debounced = useDebounce(search, 300)
  const { data, isLoading } = useCatalog({
    search: debounced.trim() || undefined,
    categoryId,
  })
  const pick = useCatalogPick({ excludeUnitIds, onPickUnit, onPickQuantity })

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("catalog.searchProducts")}
          className="h-11 pl-9"
        />
      </div>
      <CategoryChips value={categoryId} onChange={setCategoryId} />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-[16px]" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="rounded-[16px] border border-border bg-white py-12 text-center text-sm text-muted-foreground shadow-[var(--shadow-xs)]">
          {t("catalog.noUnits")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {data.map((entry) => (
            <CatalogCard key={entry.modelId} entry={entry} level={level} onTap={() => pick.handleTap(entry)} />
          ))}
        </div>
      )}

      <UnitPickerSheet
        open={pick.sheetOpen}
        entry={pick.sheetEntry}
        units={pick.sheetUnits}
        onClose={pick.closeSheet}
        onPick={pick.pickFromSheet}
      />
    </div>
  )
}
