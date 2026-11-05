import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { isNetworkError } from "@/shared/api/http"
import { unitCode } from "@/shared/lib/unit-code"
import { enqueueMutation, MUTATION_TYPES } from "@/entities/sync"
import { useSettleConsignment, type ConsignmentView } from "@/entities/consignment"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

function SettleInputs({
  salePrice,
  setSalePrice,
  notes,
  setNotes,
}: {
  salePrice: string
  setSalePrice: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("consignments.settlePrice")}</Label>
        <Input
          type="number"
          min={0}
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          className="h-10 text-base font-bold font-mono"
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="To'lov usuli, chek..."
          className="h-10"
        />
      </div>
    </>
  )
}

function SettleForm({
  consignment,
  onCancel,
  onSuccess,
}: {
  consignment: ConsignmentView
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const settleMutation = useSettleConsignment()
  const [salePrice, setSalePrice] = React.useState(consignment.agreedPrice)
  const [notes, setNotes] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dto = { salePrice: Number(salePrice), notes: notes.trim() || undefined }
    settleMutation.mutate(
      { id: consignment.id, dto },
      {
        onSuccess: () => {
          toast.success(t("consignments.settleSuccess"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => {
          if (isNetworkError(err)) {
            void enqueueMutation({
              id: crypto.randomUUID(),
              type: MUTATION_TYPES.consignmentSettle,
              payload: { consignmentId: consignment.id, ...dto },
            }).then(() => {
              toast.success(t("sync.queuedSettle"))
              onCancel()
              onSuccess?.()
            })
            return
          }
          toast.error(err?.statusCode === 409 ? t("common.retry") : (err?.message || t("common.error")))
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <SettleInputs
        salePrice={salePrice}
        setSalePrice={setSalePrice}
        notes={notes}
        setNotes={setNotes}
      />
      <p className="text-xs text-muted-foreground">{t("consignments.settleHint")}</p>
      <Button type="submit" className="w-full" disabled={settleMutation.isPending}>
        {settleMutation.isPending ? t("common.loading") : t("consignments.settle")}
      </Button>
    </form>
  )
}

export function SettleConsignmentDialog({
  consignment,
  open,
  onOpenChange,
  onSuccess,
}: {
  consignment: ConsignmentView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  if (!consignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("consignments.settle")}</DialogTitle>
          <DialogDescription>
            {consignment.imei ? "IMEI" : t("catalog.serialNumber")}: {unitCode(consignment)}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SettleForm
            consignment={consignment}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
