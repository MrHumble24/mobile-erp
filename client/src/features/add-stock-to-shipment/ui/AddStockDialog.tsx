import * as React from "react"
import { Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useDeviceModels } from "@/entities/device-model"
import { accountLabel } from "@/entities/ledger"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import { useAddShipmentItems } from "../model/use-add-shipment-items"
import type { PurchasedLineView } from "../api/shipment-items.repository"
import type { StagedLine } from "../model/add-stock.schema"
import { StockLineForm } from "./StockLineForm"

function StagedRow({ line, onRemove }: { line: StagedLine; onRemove: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0 min-w-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{line.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {t("catalog.pieces", { count: line.quantity })} × <span className="whitespace-nowrap tabular-nums">{formatMoney(line.unitCost)}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold shrink-0 whitespace-nowrap tabular-nums">{formatMoney(line.quantity * line.unitCost)}</span>
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t("common.delete")} onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function AddStockDialog({
  shipmentId,
  paymentAccountCode,
  open,
  onOpenChange,
  onAdded,
}: {
  shipmentId: string
  paymentAccountCode: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded?: (lines: PurchasedLineView[]) => void
}) {
  const { t } = useI18n()
  const { data: models } = useDeviceModels()
  const quantityModels = (models ?? []).filter((m) => m.kindCode === "QUANTITY" && m.isActive)
  const addItems = useAddShipmentItems(shipmentId)
  const [staged, setStaged] = React.useState<StagedLine[]>([])

  React.useEffect(() => {
    if (!open) setStaged([])
  }, [open])

  const total = staged.reduce((sum, l) => sum + l.quantity * l.unitCost, 0)

  const handleSave = () => {
    if (staged.length === 0) return
    addItems.mutate(
      staged.map((l) => ({ modelId: l.modelId, quantity: l.quantity, unitCost: l.unitCost })),
      {
        onSuccess: (lines) => {
          toast.success(t("catalog.stockSaved"))
          onAdded?.(lines)
          onOpenChange(false)
        },
        onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("catalog.addStock")}</DialogTitle>
          <DialogDescription>
            {t("balance.payFrom")}: {accountLabel(paymentAccountCode, undefined, t)}
          </DialogDescription>
        </DialogHeader>
        <div className="my-2 space-y-4">
          <StockLineForm
            models={quantityModels}
            onAdd={(line) => setStaged((s) => [...s, line])}
          />
          {staged.length > 0 && (
            <div className="rounded-[14px] border border-border bg-muted px-3 shadow-[var(--shadow-xs)]">
              {staged.map((line, i) => (
                <StagedRow key={`${line.modelId}-${i}`} line={line} onRemove={() => setStaged((s) => s.filter((_, j) => j !== i))} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-sm text-muted-foreground truncate">{t("catalog.lineTotal")}</span>
            <span className="text-lg font-bold shrink-0 whitespace-nowrap tabular-nums">{formatMoney(total)}</span>
          </div>
          <Button type="button" className="w-full" disabled={staged.length === 0 || addItems.isPending} onClick={handleSave}>
            {addItems.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
