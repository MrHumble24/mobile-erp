import { useI18n } from "@/shared/i18n"
import { unitCode } from "@/shared/lib/unit-code"
import { BarcodeVisual } from "@/shared/ui"
import { receiptBonusLines } from "../../lib/receipt-bonus"
import type { ReceiptView } from "../../model/sale.types"
import { ChequeBonusLine } from "./ChequeBonusLine"
import { ChequeDiscount } from "./ChequeDiscount"
import { ChequeHeader } from "./ChequeHeader"
import { ChequeItems } from "./ChequeItems"
import { ChequeMeta } from "./ChequeMeta"
import { ChequePayments } from "./ChequePayments"
import { ChequeTradeIns } from "./ChequeTradeIns"
import { ChequeWarranty } from "./ChequeWarranty"

export function ReceiptPaper({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  const bonus = receiptBonusLines(receipt.bonus, t)
  const firstItem = receipt.items[0]
  const primaryImei = (firstItem && unitCode(firstItem)) || receipt.saleId.slice(0, 15)

  return (
    <div className="printable-cheque w-full max-w-[320px] sm:w-[58mm] bg-white text-black p-4 font-mono text-[11px] leading-snug rounded-[8px] border border-[#d4d4d4] shadow-[var(--shadow-md)] print:shadow-none print:border-none print:p-0">
      <ChequeHeader soldAt={receipt.soldAt} />
      <ChequeMeta receipt={receipt} />
      <ChequeDiscount receipt={receipt} />
      <ChequeItems items={receipt.items} total={receipt.total} />
      <ChequeTradeIns tradeIns={receipt.tradeIns} />
      <ChequeBonusLine line={bonus.paidWithPoints} />
      <ChequePayments payments={receipt.payments} />
      <ChequeWarranty warranty={receipt.warranty} />
      <ChequeBonusLine line={bonus.pointsEarned} />
      <BarcodeVisual value={primaryImei} />
      <div className="pt-1 text-center text-[9px] text-black/70 space-y-0.5">
        <p className="font-medium">{t("pos.thankYou")}</p>
        <p className="text-[8px] text-black/50">www.malika-erp.uz</p>
      </div>
    </div>
  )
}
