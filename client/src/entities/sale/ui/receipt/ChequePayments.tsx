import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { accountLabel } from "@/entities/ledger"
import type { ReceiptView } from "../../model/sale.types"

export function ChequePayments({ payments }: { payments: ReceiptView["payments"] }) {
  const { t } = useI18n()
  if (!payments || payments.length === 0) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <p className="font-semibold">{t("balance.paidWith")}:</p>
      {payments.map((p) => (
        <div key={p.accountCode} className="flex justify-between items-center gap-2 min-w-0">
          <span className="min-w-0 truncate">{accountLabel(p.accountCode, undefined, t)}</span>
          <span className="font-mono shrink-0 whitespace-nowrap tabular-nums">{formatMoney(p.amount)}</span>
        </div>
      ))}
    </div>
  )
}
