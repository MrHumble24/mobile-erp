import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useRefundOnlinePayment } from "@/entities/online-payment"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

export function RefundPaymentDialog({
  paymentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  paymentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const refundMutation = useRefundOnlinePayment()
  const [reason, setReason] = React.useState("")

  const handleRefund = () => {
    if (!reason.trim()) return
    refundMutation.mutate(
      { paymentId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("orders.refundSuccess"))
          onOpenChange(false)
          setReason("")
          onSuccess?.()
        },
        onError: (err: unknown) => {
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("orders.markRefunded")}</DialogTitle>
          <DialogDescription>{t("orders.markRefundedDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="refund-reason" className="text-xs font-semibold">
            {t("orders.refundReason")} *
          </Label>
          <Input
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("orders.refundReasonPlaceholder")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleRefund}
            disabled={refundMutation.isPending || !reason.trim()}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {refundMutation.isPending ? t("common.loading") : t("orders.markRefunded")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
