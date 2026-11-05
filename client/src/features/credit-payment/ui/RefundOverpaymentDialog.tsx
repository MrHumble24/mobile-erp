import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { useRefundOverpayment } from "../model/use-credit-payment"
import { CreditTenderForm } from "./CreditTenderForm"

export interface RefundOverpaymentDialogProps {
  creditId: string
  overpaid: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Pay back an overpayment after a return (`sale.return`); capped at the overpaid amount. */
export function RefundOverpaymentDialog({ creditId, overpaid, open, onOpenChange }: RefundOverpaymentDialogProps) {
  const { t } = useI18n()
  const refund = useRefundOverpayment()

  const handleSubmit = (amount: number, accountCode: string) => {
    refund.mutate(
      { id: creditId, dto: { amount, accountCode } },
      {
        onSuccess: () => {
          toast.success(t("credit.refundSaved"))
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const e = err as { message?: string }
          toast.error(e?.message || t("common.error"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("credit.refundOverpayment")}</DialogTitle>
          <DialogDescription>#{creditId.slice(0, 8).toUpperCase()}</DialogDescription>
        </DialogHeader>
        {open && (
          <CreditTenderForm
            cap={overpaid}
            capLabel={t("credit.overpaid")}
            capMessageKey="credit.errorAboveOutstanding"
            submitLabel={t("credit.refundOverpayment")}
            pending={refund.isPending}
            onSubmit={handleSubmit}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
