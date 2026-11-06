import { useI18n } from "@/shared/i18n"
import { unitCode } from "@/shared/lib/unit-code"
import type { ReceiptItem } from "../../model/sale.types"

export function ItemIdentity({ item }: { item: ReceiptItem }) {
  const { t } = useI18n()
  if (item.quantity != null && !item.imei && !item.serialNumber) {
    return (
      <div className="text-[9px] text-black/90 tracking-wider">
        {t("catalog.pieces", { count: item.quantity })}
      </div>
    )
  }
  return (
    <>
      <div className="text-[9px] text-black/90 font-mono tracking-wider">
        {item.imei ? "IMEI" : t("catalog.serialNumber")}: {unitCode(item)}
      </div>
      {item.imei2 && (
        <div className="text-[9px] text-black/90 font-mono tracking-wider">IMEI 2: {item.imei2}</div>
      )}
    </>
  )
}
