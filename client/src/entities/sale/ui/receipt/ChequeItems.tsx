import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import type { ReceiptItem } from "../../model/sale.types"
import { ItemIdentity } from "./ItemIdentity"

export function ChequeItems({ items, total }: { items: ReceiptItem[]; total: string }) {
  const { t } = useI18n()
  return (
    <>
      <div className="py-2.5 border-b-2 border-dashed border-black/30 space-y-2">
        {items.map((item, i) => (
          <div key={unitCode(item) || `${item.model}-${i}`} className="space-y-0.5">
            <div className="flex justify-between font-bold text-[11px]">
              <span className="line-clamp-1">{item.model}</span>
              <span className="shrink-0 font-mono">{formatMoney(item.price)}</span>
            </div>
            <div className="text-[9px] text-foreground/75 flex justify-between">
              <span>{[item.storage, item.color].filter(Boolean).join(" · ")}</span>
            </div>
            <ItemIdentity item={item} />
            {item.warranty && (
              <div className="text-[9px] text-foreground/75">
                {t("pos.officialWarranty")}: {item.warranty.days} {t("pos.daysShort")} ·{" "}
                {new Date(item.warranty.endsAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="py-2.5 border-b-2 border-dashed border-black/30 flex justify-between items-center text-xs font-black">
        <span className="uppercase tracking-wider">{t("pos.totalDue")}:</span>
        <span className="font-mono text-base font-bold">{formatMoney(total)}</span>
      </div>
    </>
  )
}
