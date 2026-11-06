import { useI18n } from "@/shared/i18n"
import type { ReceiptView } from "../../model/sale.types"

export function ChequeMeta({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <div className="flex justify-between">
        <span className="font-semibold">{t("pos.cashier")}:</span>
        <span>{receipt.cashier}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">{t("pos.receiptNumber")}:</span>
        <span className="font-mono font-bold">#{receipt.saleId.slice(0, 8).toUpperCase()}</span>
      </div>
      {receipt.customer && (
        <div className="flex justify-between">
          <span className="font-semibold">{t("pos.customer")}:</span>
          <span>{receipt.customer.name} {receipt.customer.phone ? `(${receipt.customer.phone})` : ""}</span>
        </div>
      )}
    </div>
  )
}
