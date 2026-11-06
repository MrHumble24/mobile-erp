import * as React from "react"
import { useStock } from "@/entities/stock"
import { useCreateStockTransfer } from "@/entities/stock-transfer"
import { useStores } from "@/entities/store"
import { scanCode } from "@/features/scan-code"
import { useStoreSelectionStore } from "@/features/switch-store"
import { useI18n } from "@/shared/i18n"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"
import {
  TransferLinesEditor,
  type DraftTransferLine,
} from "./TransferLinesEditor"

export function CreateTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { data: stores } = useStores()
  const { data: stockLevels } = useStock()
  const currentStoreId = useStoreSelectionStore((s) => s.currentStoreId)
  const createMutation = useCreateStockTransfer()

  const [targetStoreId, setTargetStoreId] = React.useState("")
  const [note, setNote] = React.useState("")
  const [scanValue, setScanValue] = React.useState("")
  const [lines, setLines] = React.useState<DraftTransferLine[]>([])
  const [selectedProductModelId, setSelectedProductModelId] = React.useState("")
  const [productQty, setProductQty] = React.useState("1")

  const otherStores = React.useMemo(
    () => (stores ?? []).filter((s) => s.id !== currentStoreId && !s.deactivatedAt),
    [stores, currentStoreId],
  )

  React.useEffect(() => {
    if (otherStores.length > 0 && !targetStoreId) {
      setTargetStoreId(otherStores[0].id)
    }
  }, [otherStores, targetStoreId])

  const handleScan = async (code: string) => {
    try {
      const res = await scanCode(code)
      if (res.kind === "unit") {
        if (lines.some((l) => l.deviceId === res.unit.id)) {
          toast.error(t("transfers.alreadyAdded"))
          return
        }
        setLines((prev) => [
          ...prev,
          {
            lineType: "UNIT",
            deviceId: res.unit.id,
            label: `${res.unit.model.brand} ${res.unit.model.name}`,
            identifier: res.unit.imei ?? res.unit.serialNumber ?? undefined,
          },
        ])
        setScanValue("")
        toast.success(t("transfers.unitAdded"))
      } else if (res.kind === "product") {
        const existing = lines.find((l) => l.modelId === res.product.modelId)
        if (existing) {
          setLines((prev) =>
            prev.map((l) =>
              l.modelId === res.product.modelId
                ? { ...l, quantity: (l.quantity ?? 1) + 1 }
                : l,
            ),
          )
        } else {
          setLines((prev) => [
            ...prev,
            {
              lineType: "QUANTITY",
              modelId: res.product.modelId,
              label: `${res.product.brand} ${res.product.name}`,
              quantity: 1,
            },
          ])
        }
        setScanValue("")
        toast.success(t("transfers.productAdded"))
      } else {
        toast.error(t("transfers.scanNotFound"))
      }
    } catch {
      toast.error(t("transfers.scanNotFound"))
    }
  }

  const handleAddProduct = () => {
    if (!selectedProductModelId) return
    const p = stockLevels?.find((s) => s.modelId === selectedProductModelId)
    if (!p) return
    const qty = parseInt(productQty, 10) || 1
    const existing = lines.find((l) => l.modelId === p.modelId)
    if (existing) {
      setLines((prev) =>
        prev.map((l) =>
          l.modelId === p.modelId ? { ...l, quantity: (l.quantity ?? 1) + qty } : l,
        ),
      )
    } else {
      setLines((prev) => [
        ...prev,
        {
          lineType: "QUANTITY",
          modelId: p.modelId,
          label: `${p.brand} ${p.name}`,
          quantity: qty,
          availableStock: p.quantity,
        },
      ])
    }
    setSelectedProductModelId("")
    setProductQty("1")
  }

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateQty = (idx: number, qty: number) => {
    setLines((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, quantity: qty } : line)),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStoreId) {
      toast.error(t("transfers.selectDestination"))
      return
    }
    if (lines.length === 0) {
      toast.error(t("transfers.emptyLines"))
      return
    }

    createMutation.mutate(
      {
        targetStoreId,
        note: note.trim() || undefined,
        lines: lines.map((l) =>
          l.lineType === "UNIT"
            ? { lineType: "UNIT", deviceId: l.deviceId }
            : { lineType: "QUANTITY", modelId: l.modelId, quantity: l.quantity ?? 1 },
        ),
      },
      {
        onSuccess: () => {
          toast.success(t("transfers.created"))
          onOpenChange(false)
          setLines([])
          setNote("")
          setScanValue("")
        },
        onError: (err: { message?: string }) =>
          toast.error(err?.message || t("common.error")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("transfers.newTransfer")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1">
            <Label>{t("transfers.destinationStore")}</Label>
            <Select value={targetStoreId} onValueChange={(val) => setTargetStoreId(val ?? "")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={t("transfers.selectDestination")} />
              </SelectTrigger>
              <SelectContent>
                {otherStores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t("transfers.scanItem")}</Label>
            <BarcodeInput
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onScan={handleScan}
              onClear={() => setScanValue("")}
              placeholder={t("transfers.scanPlaceholder")}
            />
          </div>

          <div className="p-3 bg-muted border border-border rounded-[12px] space-y-2">
            <Label className="text-xs">{t("transfers.addQuantityProduct")}</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={selectedProductModelId}
                  onValueChange={(val) => setSelectedProductModelId(val ?? "")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t("transfers.selectProduct")} />
                  </SelectTrigger>
                  <SelectContent>
                    {stockLevels
                      ?.filter((s) => s.quantity > 0)
                      .map((s) => (
                        <SelectItem key={s.modelId} value={s.modelId}>
                          {s.brand} {s.name} ({s.quantity} {t("transfers.inStock")})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                min="1"
                className="w-20 h-9 text-xs"
                value={productQty}
                onChange={(e) => setProductQty(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProduct}
                disabled={!selectedProductModelId}
              >
                {t("common.add")}
              </Button>
            </div>
          </div>

          <TransferLinesEditor
            lines={lines}
            onUpdateQty={handleUpdateQty}
            onRemoveLine={handleRemoveLine}
          />

          <div className="space-y-1">
            <Label>{t("common.notes")}</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("transfers.notePlaceholder")}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending || lines.length === 0}
          >
            {createMutation.isPending
              ? t("common.loading")
              : t("transfers.sendTransfer")}
          </Button>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
