import { formatMoney } from "@/shared/lib/format"
import { BarcodeVisual } from "@/shared/ui/barcode-visual"
import type { PriceTagItem } from "../model/price-tag.types"

/** One printed label: name, optional spec line, price and barcode. */
export function PriceTag({ item }: { item: PriceTagItem }) {
  return (
    <div className="flex flex-col items-center gap-1 break-inside-avoid rounded-[8px] border-2 border-black bg-white px-2 py-3 text-center text-black">
      <div className="text-sm font-bold leading-tight">{item.title}</div>
      {item.subtitle && <div className="text-[11px] leading-tight text-black/70">{item.subtitle}</div>}
      {item.price !== null && (
        <div className="my-1 text-2xl font-bold tracking-tight">{formatMoney(item.price)}</div>
      )}
      {item.code && <BarcodeVisual value={item.code} />}
    </div>
  )
}
