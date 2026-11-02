import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { isNetworkError } from "@/shared/api/http"
import { enqueueMutation, MUTATION_TYPES } from "@/entities/sync"
import { useReturnConsignment, type ConsignmentView } from "@/entities/consignment"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

type Condition = "IN_STOCK" | "DEFECTIVE"

function ReturnForm({
  consignment,
  onCancel,
  onSuccess,
}: {
  consignment: ConsignmentView
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const returnMutation = useReturnConsignment()
  const [reason, setReason] = React.useState("")
  const [condition, setCondition] = React.useState<Condition>("IN_STOCK")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dto = { reason: reason.trim() || undefined, condition }
    returnMutation.mutate(
      { id: consignment.id, dto },
      {
        onSuccess: () => {
          toast.success(t("consignments.returnSuccess"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => {
          if (isNetworkError(err)) {
            void enqueueMutation({
              id: crypto.randomUUID(),
              type: MUTATION_TYPES.consignmentReturn,
              payload: { consignmentId: consignment.id, ...dto },
            }).then(() => {
              toast.success(t("sync.queuedReturn"))
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
      <div className="space-y-1">
        <Label>{t("consignments.returnCondition")}</Label>
        <Select value={condition} onValueChange={(v) => setCondition((v as Condition) || "IN_STOCK")}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_STOCK">{t("consignments.conditionInStock")}</SelectItem>
            <SelectItem value="DEFECTIVE">{t("consignments.conditionDefective")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>{t("consignments.returnReason")}</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Mijoz olmadi, narx to'g'ri kelmadi..."
          className="h-10"
        />
      </div>

      <Button type="submit" variant="destructive" className="w-full" disabled={returnMutation.isPending}>
        {returnMutation.isPending ? t("common.loading") : t("consignments.return")}
      </Button>
    </form>
  )
}

export function ReturnConsignmentDialog({
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
          <DialogTitle>{t("consignments.return")}</DialogTitle>
          <DialogDescription>IMEI: {consignment.imei}</DialogDescription>
        </DialogHeader>
        {open && (
          <ReturnForm
            consignment={consignment}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
