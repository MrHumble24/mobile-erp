import { useI18n } from "@/shared/i18n"
import { useSaleReceipt, ReceiptPrintView } from "@/entities/sale"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

export function SaleReceiptDialog({
  saleId,
  open,
  onOpenChange,
}: {
  saleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { data: receipt, isLoading } = useSaleReceipt(open ? saleId : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("sales.receipt")}</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
          {receipt && <ReceiptPrintView receipt={receipt} />}
        </div>
      </DialogPopup>
    </Dialog>
  )
}
