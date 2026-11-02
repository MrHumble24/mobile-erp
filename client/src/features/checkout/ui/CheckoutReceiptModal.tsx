import { useI18n } from "@/shared/i18n"
import { useSaleReceipt, ReceiptPrintView } from "@/entities/sale"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

export function CheckoutReceiptModal({
  saleId,
  open,
  onOpenChange,
}: {
  saleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { data: receipt, isLoading } = useSaleReceipt(saleId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pos.receiptTitle")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : receipt ? (
          <ReceiptPrintView receipt={receipt} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">{t("common.notFound")}</div>
        )}
      </DialogPopup>
    </Dialog>
  )
}
