import { Trash2, Minus, Plus, AlertTriangle, Package } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { useCartStore, type QuantityCartLine as QuantityCartLineModel } from "../model/cart.store"
import { lineTotal } from "../lib/line-total"

function QuantityStepper({ line }: { line: QuantityCartLineModel }) {
  const { t } = useI18n()
  const setLineQuantity = useCartStore((s) => s.setLineQuantity)
  return (
    <div className="space-y-1">
      <Label>{t("catalog.quantity")}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={t("pos.decreaseQuantity")}
          onClick={() => setLineQuantity(line.lineId, line.quantity - 1)}
        >
          <Minus className="size-4" />
        </Button>
        <Input
          type="number"
          min={1}
          value={line.quantity}
          onChange={(e) => setLineQuantity(line.lineId, Number(e.target.value))}
          className="h-10 text-center text-lg font-bold"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={t("pos.increaseQuantity")}
          onClick={() => setLineQuantity(line.lineId, line.quantity + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function QuantityCartLine({ line }: { line: QuantityCartLineModel }) {
  const { t } = useI18n()
  const removeLine = useCartStore((s) => s.removeLine)
  const setLineUnitPrice = useCartStore((s) => s.setLineUnitPrice)
  const overStock = line.quantity > line.onHand

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white p-3 shadow-[var(--shadow-xs)] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base leading-tight truncate">{line.name}</h3>
            {line.barcode && (
              <p className="font-mono text-xs text-muted-foreground">{line.barcode}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("catalog.onHand")}: {t("catalog.pieces", { count: line.onHand })}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-600 shrink-0"
          onClick={() => removeLine(line.lineId)}
          aria-label={t("pos.removeLine")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <QuantityStepper line={line} />
        <div className="space-y-1">
          <Label>{t("catalog.unitPrice")}</Label>
          <Input
            type="number"
            min={0}
            value={line.unitPrice || ""}
            onChange={(e) => setLineUnitPrice(line.lineId, Number(e.target.value))}
            className="h-10 text-lg font-bold"
          />
        </div>
      </div>

      {overStock && (
        <div className="flex items-center gap-2 rounded-[10px] border border-amber-300 bg-amber-50/60 p-2 text-xs text-amber-700">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{t("catalog.belowZero")}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#e8e8e8] pt-2 text-sm">
        <span className="text-muted-foreground">{t("catalog.lineTotal")}</span>
        <span className="text-lg font-bold text-primary">{formatMoney(lineTotal(line))}</span>
      </div>
    </div>
  )
}
