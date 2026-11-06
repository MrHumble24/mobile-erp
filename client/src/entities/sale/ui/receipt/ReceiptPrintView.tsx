import type { ReceiptView } from "../../model/sale.types"
import { ChequeActions } from "./ChequeActions"
import { ReceiptPaper } from "./ReceiptPaper"

export function ReceiptPrintView({
  receipt,
  onNewSale,
}: {
  receipt: ReceiptView
  onNewSale?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <ReceiptPaper receipt={receipt} />
      <ChequeActions receipt={receipt} onNewSale={onNewSale} />
    </div>
  )
}
