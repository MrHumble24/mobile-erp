import { CheckCircle2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSaleReceipt, ReceiptPrintView } from "@/entities/sale"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"

export interface CheckoutReceiptModalProps {
  saleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewSale?: () => void
}

export function CheckoutReceiptModal({
  saleId,
  open,
  onOpenChange,
  onNewSale,
}: CheckoutReceiptModalProps) {
  const { t } = useI18n()
  const { data: receipt, isLoading } = useSaleReceipt(saleId)

  const handleNewSale = () => {
    onOpenChange(false)
    onNewSale?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center items-center pb-2">
          <div className="size-12 rounded-full bg-[#00c07a]/15 text-[#00c07a] flex items-center justify-center mb-1">
            <CheckCircle2 className="size-6 stroke-[2.2]" />
          </div>
          <DialogTitle className="text-lg font-bold">{t("pos.saleSuccess")}</DialogTitle>
          <DialogDescription className="text-xs text-[#646464]">
            {t("pos.chequeSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 flex justify-center w-full">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : receipt ? (
            <ReceiptPrintView receipt={receipt} onNewSale={handleNewSale} />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("common.notFound")}
            </div>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  )
}
