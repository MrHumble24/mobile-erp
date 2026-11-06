import * as React from "react"
import { Package, Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useDebounce } from "@/shared/lib/hooks/use-debounce"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { useStock, type StockLevelView } from "@/entities/stock"
import { useCartStore } from "@/features/checkout"

function ResultRow({ product, onAdd }: { product: StockLevelView; onAdd: () => void }) {
  const { t } = useI18n()
  return (
    <Button
      type="button"
      variant="ghost"
      className="flex h-auto w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left"
      onClick={onAdd}
    >
      <span className="flex items-center gap-2 min-w-0">
        <Package className="size-4 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {product.brand} {product.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {t("catalog.onHand")}: {t("catalog.pieces", { count: product.quantity })} ·{" "}
            {formatMoney(product.salePrice)}
          </span>
        </span>
      </span>
      <Plus className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  )
}

/** Type-to-find a quantity product by name/barcode/model code; a click adds it to the cart. */
export function ProductSearch() {
  const { t } = useI18n()
  const [search, setSearch] = React.useState("")
  const debounced = useDebounce(search, 300)
  const addProduct = useCartStore((s) => s.addProduct)
  const { data } = useStock(debounced.trim().length >= 2 ? { search: debounced.trim() } : undefined)
  const results = debounced.trim().length >= 2 ? (data ?? []) : []

  const handleAdd = (product: StockLevelView) => {
    addProduct({
      modelId: product.modelId,
      brand: product.brand,
      name: product.name,
      barcode: product.barcode,
      salePrice: product.salePrice,
      quantity: product.quantity,
    })
    setSearch("")
  }

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("pos.findProduct")}
        className="h-11"
      />
      {results.length > 0 && (
        <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-[12px] border border-border bg-card p-1 shadow-[var(--shadow-xs)]">
          {results.map((p) => (
            <ResultRow key={p.modelId} product={p} onAdd={() => handleAdd(p)} />
          ))}
        </div>
      )}
    </div>
  )
}
