import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSaleReceipts, ReceiptPrintView, type ReceiptView } from "@/entities/sale"
import { usePrintSettings } from "@/entities/settings"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"

const AUTO_PRINT_KEY = "pos-auto-print"

function readAutoPrint(): boolean {
  try {
    return localStorage.getItem(AUTO_PRINT_KEY) === "1"
  } catch {
    return false
  }
}

function writeAutoPrint(value: boolean) {
  try {
    localStorage.setItem(AUTO_PRINT_KEY, value ? "1" : "0")
  } catch {
    /* storage unavailable (private mode); auto-print simply won't persist */
  }
}

export interface CheckoutReceiptModalProps {
  saleIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewSale?: () => void
}

function AutoPrintToggle({ open, receipt, canPrint }: { open: boolean; receipt: ReceiptView | null; canPrint: boolean }) {
  const { t } = useI18n()
  const [autoPrint, setAutoPrint] = React.useState(readAutoPrint)
  const printedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open) printedRef.current = false
  }, [open])

  React.useEffect(() => {
    if (canPrint && open && autoPrint && receipt && !printedRef.current) {
      printedRef.current = true
      window.print()
    }
  }, [canPrint, open, autoPrint, receipt])

  return (
    <Label className="print:hidden flex items-center justify-center gap-2 text-xs text-muted-foreground pb-1">
      <Switch
        checked={autoPrint}
        onCheckedChange={(v) => {
          setAutoPrint(v)
          writeAutoPrint(v)
        }}
      />
      {t("pos.autoPrint")}
    </Label>
  )
}

function ReceiptBody({
  receipt,
  isLoading,
  onNewSale,
  paperWidthMm,
  canPrint,
}: {
  receipt: ReceiptView | null
  isLoading: boolean
  onNewSale: () => void
  paperWidthMm: 58 | 80
  canPrint: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="py-2 flex justify-center w-full">
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      ) : receipt ? (
        <ReceiptPrintView receipt={receipt} onNewSale={onNewSale} paperWidthMm={paperWidthMm} canPrint={canPrint} />
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">{t("common.notFound")}</div>
      )}
    </div>
  )
}

export function CheckoutReceiptModal({
  saleIds,
  open,
  onOpenChange,
  onNewSale,
}: CheckoutReceiptModalProps) {
  const { t } = useI18n()
  const { receipt, isLoading } = useSaleReceipts(open ? saleIds : [])
  const { receiptPrintingEnabled, receiptPaperWidthMm } = usePrintSettings()

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
        {receiptPrintingEnabled && (
          <AutoPrintToggle open={open} receipt={receipt} canPrint={receiptPrintingEnabled} />
        )}
        <ReceiptBody
          receipt={receipt}
          isLoading={isLoading}
          onNewSale={handleNewSale}
          paperWidthMm={receiptPaperWidthMm}
          canPrint={receiptPrintingEnabled}
        />
      </DialogPopup>
    </Dialog>
  )
}
