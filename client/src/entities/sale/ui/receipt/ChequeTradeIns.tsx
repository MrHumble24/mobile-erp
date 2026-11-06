import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { ReceiptView } from "../../model/sale.types"

export function ChequeTradeIns({ tradeIns }: { tradeIns: ReceiptView["tradeIns"] }) {
  const { t } = useI18n()
  if (!tradeIns || tradeIns.length === 0) return null
  return (
    <div className="py-2 border-b border-dashed border-black/30 space-y-0.5 text-[10px]">
      <p className="font-semibold">{t("purchases.tradeInLabel")}:</p>
      {tradeIns.map((ti) => (
        <div key={ti.deviceId} className="flex justify-between items-center gap-2 min-w-0">
          <span className="truncate min-w-0">
            {ti.model.brand} {ti.model.name}
            {(ti.imei || ti.serialNumber) && ` · ${ti.imei ?? ti.serialNumber}`}
          </span>
          <span className="font-mono shrink-0 whitespace-nowrap tabular-nums">− {formatMoney(ti.value)}</span>
        </div>
      ))}
    </div>
  )
}
