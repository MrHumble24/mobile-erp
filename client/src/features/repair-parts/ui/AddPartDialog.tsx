import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCatalog } from "@/entities/catalog"
import { useAddRepairPart, repairErrorKey } from "@/entities/repair"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

function ProductSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  const { data: catalog, isError, isLoading } = useCatalog()
  // Parts come out of quantity stock only (server rule).
  const products = (catalog ?? []).filter((p) => p.kindCode === "QUANTITY")
  return (
    <div className="space-y-1">
      <Label>{t("repairs.pickProduct")}</Label>
      <Select value={value || undefined} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="h-10"><SelectValue placeholder={t("repairs.pickProduct")} /></SelectTrigger>
        <SelectContent>
          {products.map((p) => (
            <SelectItem key={p.modelId} value={p.modelId}>
              {p.brand} {p.name} · {p.inStock} {t("repairs.inStock")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isError ? (
        <p className="text-xs text-destructive">{t("repairs.loadError")}</p>
      ) : (
        !isError && !isLoading && products.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("repairs.noQuantityProducts")}</p>
        )
      )}
    </div>
  )
}

function AddPartForm({ repairId, onDone }: { repairId: string; onDone: () => void }) {
  const { t } = useI18n()
  const add = useAddRepairPart(repairId)
  const [modelId, setModelId] = React.useState("")
  const [quantity, setQuantity] = React.useState(1)
  const invalid = !modelId || quantity < 1

  const submit = () => {
    add.mutate(
      { modelId, quantity },
      {
        onSuccess: () => {
          toast.success(t("repairs.partAdded"))
          onDone()
        },
        onError: (err: Error) => {
          const key = repairErrorKey(err)
          toast.error(key ? t(key) : err.message || t("common.error"))
        },
      }
    )
  }

  return (
    <div className="space-y-4 my-2">
      <ProductSelect value={modelId} onChange={setModelId} />
      <div className="space-y-1">
        <Label>{t("repairs.quantity")}</Label>
        <Input
          type="number"
          min={1}
          value={quantity || ""}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
          className="h-10 text-base font-bold"
        />
      </div>
      <Button className="w-full" disabled={invalid || add.isPending} onClick={submit}>
        {add.isPending ? t("common.loading") : t("repairs.addPart")}
      </Button>
    </div>
  )
}

export interface AddPartDialogProps {
  repairId: string
  /** Human ticket number shown instead of a UUID fragment. */
  ticketNumber?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Take a quantity product out of stock for the ticket (`repair.manage`). */
export function AddPartDialog({ repairId, ticketNumber, open, onOpenChange }: AddPartDialogProps) {
  const { t } = useI18n()
  const label = ticketNumber != null ? `#${ticketNumber}` : t("repairs.ticketLabel")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("repairs.addPartTitle")}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        {open && <AddPartForm repairId={repairId} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
