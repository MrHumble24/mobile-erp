import { ScanLine } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { CatalogBrowser } from "@/features/catalog-sell"
import { CartLines } from "@/features/checkout"
import type { usePosTerminal } from "../model/use-pos-terminal"
import { PosScanner } from "./PosScanner"
import { ProductSearch } from "./ProductSearch"

type Pos = ReturnType<typeof usePosTerminal>

/**
 * The working side of the till: a permanent capture field at the top and a
 * bounded, internally scrolling area for the cart (or the catalog grid). The
 * scan field never scrolls away — the cashier always has somewhere to scan.
 */
export function PosWorkPane({ pos }: { pos: Pos }) {
  const { t } = useI18n()
  const catalog = pos.inputMode === "catalog"
  const linePerms = {
    canViewCost: pos.canViewCost,
    minMarginPercent: pos.minMargin,
    canOverridePrice: pos.canOverridePrice,
    canDiscountUnlimited: pos.canDiscountUnlimited,
  }

  return (
    <section className="flex min-h-[420px] flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="shrink-0 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="mb-2.5 flex items-center gap-2">
          <ScanLine className="size-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground">{t("pos.scanPrompt")}</span>
        </div>
        <PosScanner scanner={pos.scanner} />
        {!catalog && pos.mode === "sale" && (
          <div className="mt-3 border-t border-border pt-3">
            <ProductSearch />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)] lg:overflow-y-auto">
        {catalog ? (
          <CatalogBrowser
            level={pos.priceLevelCode}
            excludeUnitIds={pos.excludeUnitIds}
            onPickUnit={pos.onPickUnit}
            onPickQuantity={pos.onPickQuantity}
          />
        ) : (
          <CartLines {...linePerms} />
        )}
      </div>
    </section>
  )
}
