import type { PriceTagItem } from "../model/price-tag.types"
import { PriceTag } from "./PriceTag"

/** The printable A4 sheet: three labels across, only the ticked items. */
export function PriceTagSheet({ items }: { items: PriceTagItem[] }) {
  return (
    <div className="printable-tags grid grid-cols-3 gap-3 bg-white p-3">
      {items.map((item) => (
        <PriceTag key={item.id} item={item} />
      ))}
    </div>
  )
}
