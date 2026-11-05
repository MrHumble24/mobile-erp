import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import { AdjustStockDialog } from "@/features/adjust-stock"
import type { StockLevelView } from "@/entities/stock"
import { PageHeader } from "@/shared/ui/page-header"
import { MetricCard } from "@/shared/ui/metric-card"
import { Skeleton } from "@/shared/ui/skeleton"
import { useStockBrowser } from "../model/use-stock-browser"
import { StockFilters } from "./StockFilters"
import { StockTable } from "./StockTable"
import { StockMovementsDrawer } from "./StockMovementsDrawer"

function totalValue(items: StockLevelView[]): number {
  return items.reduce((sum, p) => sum + Number(p.value ?? 0), 0)
}

export function StockPage() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canViewCost = hasPermission("device.cost.view")
  const canAdjust = hasPermission("stock.adjust")

  const browser = useStockBrowser()
  const items = browser.query.data ?? []

  const [movementsOf, setMovementsOf] = React.useState<StockLevelView | null>(null)
  const [adjustOf, setAdjustOf] = React.useState<StockLevelView | null>(null)

  return (
    <div className="space-y-5">
      <PageHeader title={t("catalog.stockTitle")} />

      {canViewCost && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <MetricCard label={t("catalog.stock")} value={items.length} />
          <MetricCard label={t("catalog.stockValue")} value={formatMoney(totalValue(items))} />
        </div>
      )}

      <StockFilters browser={browser} />

      {browser.query.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[16px]" />
      ) : items.length === 0 ? (
        <div className="rounded-[16px] border-2 border-dashed py-16 text-center text-muted-foreground">
          {t("catalog.stockEmpty")}
        </div>
      ) : (
        <StockTable
          items={items}
          canViewCost={canViewCost}
          canAdjust={canAdjust}
          onMovements={setMovementsOf}
          onAdjust={setAdjustOf}
        />
      )}

      <StockMovementsDrawer
        product={movementsOf}
        open={Boolean(movementsOf)}
        onClose={() => setMovementsOf(null)}
        canViewCost={canViewCost}
      />
      <AdjustStockDialog
        product={adjustOf}
        open={Boolean(adjustOf)}
        onOpenChange={(v) => !v && setAdjustOf(null)}
      />
    </div>
  )
}
