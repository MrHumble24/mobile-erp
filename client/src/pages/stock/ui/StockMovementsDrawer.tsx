import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { formatDateTime, formatMoney } from "@/shared/lib/format"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Skeleton } from "@/shared/ui/skeleton"
import { Pagination } from "@/shared/ui/pagination"
import {
  useStockMovements,
  movementLabelKey,
  type StockLevelView,
  type StockMovement,
} from "@/entities/stock"

const PAGE_SIZE = 20

function MovementRow({ m, canViewCost }: { m: StockMovement; canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{t(movementLabelKey(m.typeCode))}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(m.occurredAt)} · {m.createdBy.name}
        </p>
        {m.note && <p className="text-xs italic text-muted-foreground">"{m.note}"</p>}
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold", m.quantity < 0 ? "text-red-600" : "text-emerald-600")}>
          {m.quantity > 0 ? "+" : ""}{m.quantity}
        </p>
        {canViewCost && m.unitCostSnapshot && (
          <p className="text-xs text-muted-foreground">{formatMoney(m.unitCostSnapshot)}</p>
        )}
      </div>
    </div>
  )
}

export function StockMovementsDrawer({
  product,
  open,
  onClose,
  canViewCost,
}: {
  product: StockLevelView | null
  open: boolean
  onClose: () => void
  canViewCost: boolean
}) {
  const { t } = useI18n()
  const [page, setPage] = React.useState(1)
  React.useEffect(() => {
    if (open) setPage(1)
  }, [open, product?.modelId])
  const { data, isLoading } = useStockMovements(open ? product?.modelId ?? null : null, page, PAGE_SIZE)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("catalog.movements")}</SheetTitle>
          <SheetDescription>{product ? `${product.brand} ${product.name}` : ""}</SheetDescription>
        </SheetHeader>
        <div className="my-4 space-y-3 overflow-y-auto">
          {isLoading && <Skeleton className="h-48 rounded-[12px]" />}
          {!isLoading && (!data || data.items.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("catalog.movementsEmpty")}</p>
          )}
          {data && data.items.length > 0 && (
            <>
              <div className="rounded-[14px] border border-border bg-card px-3 shadow-[var(--shadow-xs)]">
                {data.items.map((m) => (
                  <MovementRow key={m.id} m={m} canViewCost={canViewCost} />
                ))}
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data.total}
                rangeLabel={(from, to, total) => `${from}–${to} / ${total}`}
                onPageChange={setPage}
                onPageSizeChange={() => {}}
              />
            </>
          )}
        </div>
      </SheetPopup>
    </Sheet>
  )
}
