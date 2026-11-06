import { useI18n } from "@/shared/i18n"
import type { ReceiptView } from "../../model/sale.types"

export function ChequeWarranty({ warranty }: { warranty: ReceiptView["warranty"] }) {
  const { t } = useI18n()
  if (!warranty) return null
  return (
    <div className="my-2 p-2 border border-black/40 rounded bg-black/[0.02] text-center space-y-0.5">
      <p className="font-bold text-[10px] uppercase tracking-wider">{t("pos.officialWarranty")}</p>
      <p className="font-semibold text-[10px] text-black/90">
        {warranty.days} kun ({new Date(warranty.endsAt).toLocaleDateString()} gacha)
      </p>
      <p className="text-[8px] text-black/60 italic">{t("pos.warrantyNotice")}</p>
    </div>
  )
}
