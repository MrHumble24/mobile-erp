import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useReturnConsignment, type ConsignmentView } from "@/entities/consignment"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    returnMutation.mutate(
      {
        id: consignment.id,
        dto: { reason: reason.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success(t("consignments.returnSuccess"))
          onCancel()
          onSuccess?.()
        },
        onError: (err: any) => {
          toast.error(err?.statusCode === 409 ? t("common.retry") : (err?.message || t("common.error")))
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
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
