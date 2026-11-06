import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { ReceiptView } from "../../model/sale.types"

export function ChequeDiscount({ receipt }: { receipt: ReceiptView }) {
  const { t } = useI18n()
  const discount = Number(receipt.discountAmount ?? 0)
  if (discount <= 0 || receipt.listPrice == null) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <div className="flex justify-between items-center gap-2 min-w-0">
        <span className="min-w-0 truncate">{t("pricing.listPrice")}</span>
        <span className="font-mono shrink-0 whitespace-nowrap tabular-nums">{formatMoney(receipt.listPrice)}</span>
      </div>
      <div className="flex justify-between items-center gap-2 min-w-0">
        <span className="min-w-0 truncate">{t("pricing.discount")}</span>
        <span className="font-mono shrink-0 whitespace-nowrap tabular-nums">− {formatMoney(receipt.discountAmount)}</span>
      </div>
    </div>
  )
}
