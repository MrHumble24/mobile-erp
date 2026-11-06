import { History, SlidersHorizontal } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { formatMoney } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import type { StockLevelView } from "@/entities/stock"

export interface StockTableProps {
  items: StockLevelView[]
  canViewCost: boolean
  canAdjust: boolean
  onMovements: (product: StockLevelView) => void
  onAdjust: (product: StockLevelView) => void
}

function QuantityCell({ quantity }: { quantity: number }) {
  const { t } = useI18n()
  if (quantity < 0) {
    return (
      <Badge variant="destructive" title={t("catalog.belowZero")}>
        {t("catalog.pieces", { count: quantity })}
      </Badge>
    )
  }
  if (quantity === 0) {
    return <Badge variant="outline">{t("catalog.outOfStock")}</Badge>
  }
  return <span className="font-semibold">{t("catalog.pieces", { count: quantity })}</span>
}

function StockRow({ product, canViewCost, canAdjust, onMovements, onAdjust }: {
  product: StockLevelView
  canViewCost: boolean
  canAdjust: boolean
  onMovements: () => void
  onAdjust: () => void
}) {
  const { t } = useI18n()
  return (
    <TableRow className={cn(product.quantity < 0 && "bg-destructive/10")}>
      <TableCell>
        <div className="text-sm font-semibold">{product.brand} {product.name}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {product.barcode ?? product.modelCode ?? "—"}
        </div>
      </TableCell>
      <TableCell><QuantityCell quantity={product.quantity} /></TableCell>
      <TableCell className="text-sm font-medium">{formatMoney(product.salePrice)}</TableCell>
      {canViewCost && (
        <TableCell className="text-sm text-muted-foreground">{formatMoney(product.averageCost)}</TableCell>
      )}
      {canViewCost && (
        <TableCell className="text-sm font-semibold">{formatMoney(product.value)}</TableCell>
      )}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="size-8" aria-label={t("catalog.movements")} title={t("catalog.movements")} onClick={onMovements}>
            <History className="size-4" />
          </Button>
          {canAdjust && (
            <Button size="icon" variant="ghost" className="size-8" aria-label={t("catalog.adjustStock")} title={t("catalog.adjustStock")} onClick={onAdjust}>
              <SlidersHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function StockTable({ items, canViewCost, canAdjust, onMovements, onAdjust }: StockTableProps) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("catalog.onHand")}</TableHead>
            <TableHead>{t("catalog.salePrice")}</TableHead>
            {canViewCost && <TableHead>{t("catalog.averageCost")}</TableHead>}
            {canViewCost && <TableHead>{t("catalog.stockValue")}</TableHead>}
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <StockRow
              key={p.modelId}
              product={p}
              canViewCost={canViewCost}
              canAdjust={canAdjust}
              onMovements={() => onMovements(p)}
              onAdjust={() => onAdjust(p)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
