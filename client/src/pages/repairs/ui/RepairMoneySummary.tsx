import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { RepairView } from "@/entities/repair"
import { Line } from "./RepairDetailLine"

/** Agreed / paid / left-to-pay always; cost figures only when the server sends
 *  them (the caller has `device.cost.view`). Never render a null cost. */
export function RepairMoneySummary({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const outstanding = Number(repair.outstanding)
  return (
    <div className="rounded-[12px] border border-border bg-muted p-3">
      <h3 className="text-sm font-semibold tracking-tight mb-1">{t("repairs.moneyTitle")}</h3>
      <Line label={t("repairs.agreedPrice")} value={formatMoney(repair.agreedPrice)} strong />
      <Line label={t("repairs.paid")} value={formatMoney(repair.paid)} />
      <Line
        label={outstanding < 0 ? t("repairs.overpaid") : t("repairs.leftToPay")}
        value={formatMoney(Math.abs(outstanding))}
        danger={outstanding > 0}
      />
      {repair.partsCost != null && <Line label={t("repairs.partsCost")} value={formatMoney(repair.partsCost)} />}
      {repair.outsidePaid != null && <Line label={t("repairs.outsidePaid")} value={formatMoney(repair.outsidePaid)} />}
      {repair.profit != null && <Line label={t("repairs.profit")} value={formatMoney(repair.profit)} strong />}
    </div>
  )
}
