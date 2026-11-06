import type { ReceiptView } from "../../model/sale.types"
import { ChequeActions } from "./ChequeActions"
import { ReceiptPaper } from "./ReceiptPaper"

export function ReceiptPrintView({
  receipt,
  onNewSale,
  paperWidthMm,
  canPrint,
}: {
  receipt: ReceiptView
  onNewSale?: () => void
  paperWidthMm: 58 | 80
  canPrint: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <ReceiptPaper receipt={receipt} paperWidthMm={paperWidthMm} canPrint={canPrint} />
      <ChequeActions receipt={receipt} onNewSale={onNewSale} canPrint={canPrint} />
    </div>
  )
}
