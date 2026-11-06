import { useI18n } from "@/shared/i18n"
import { useSaleReceipt, ReceiptPrintView } from "@/entities/sale"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"

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
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center items-center pb-2">
          <DialogTitle className="text-lg font-bold">{t("pos.receiptTitle")}</DialogTitle>
          {receipt && (
            <DialogDescription className="text-xs text-muted-foreground">
              {t("pos.receiptNumber")}: #{receipt.saleId.slice(0, 8).toUpperCase()}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2 flex justify-center w-full">
          {isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
          )}
          {!isLoading && !receipt && (
            <div className="py-12 text-center text-sm text-muted-foreground">{t("common.notFound")}</div>
          )}
          {receipt && <ReceiptPrintView receipt={receipt} />}
        </div>
      </DialogPopup>
    </Dialog>
  )
}
