import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { useAddCreditPayment } from "../model/use-credit-payment"
import { CreditTenderForm } from "./CreditTenderForm"

export interface TakePaymentDialogProps {
  creditId: string
  outstanding: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Take a later payment on a credit (`sale.create`); the server caps it at outstanding. */
export function TakePaymentDialog({ creditId, outstanding, open, onOpenChange }: TakePaymentDialogProps) {
  const { t } = useI18n()
  const addPayment = useAddCreditPayment()

  const handleSubmit = (amount: number, accountCode: string) => {
    addPayment.mutate(
      { id: creditId, dto: { amount, accountCode } },
      {
        onSuccess: () => {
          toast.success(t("credit.paymentSaved"))
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const e = err as { statusCode?: number; message?: string }
          toast.error(e?.statusCode === 400 ? t("credit.errorAboveOutstanding") : e?.message || t("common.error"))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("credit.takePayment")}</DialogTitle>
          <DialogDescription>#{creditId.slice(0, 8).toUpperCase()}</DialogDescription>
        </DialogHeader>
        {open && (
          <CreditTenderForm
            cap={outstanding}
            capLabel={t("credit.outstanding")}
            capMessageKey="credit.errorAboveOutstanding"
            submitLabel={t("credit.takePayment")}
            pending={addPayment.isPending}
            onSubmit={handleSubmit}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
