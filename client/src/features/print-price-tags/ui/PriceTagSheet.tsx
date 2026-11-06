import { cn } from "@/shared/lib/utils"
import type { PriceTagItem } from "../model/price-tag.types"
import { PriceTag } from "./PriceTag"

/**
 * Three labels across. With `printable` it is the sheet the print styles pick up
 * (class `printable-tags`): hidden on screen, the only thing on paper. Without it,
 * the same grid is just the on-screen preview.
 */
export function PriceTagSheet({ items, printable }: { items: PriceTagItem[]; printable?: boolean }) {
  return (
    <div className={cn("grid-cols-3 gap-3 bg-card p-3", printable ? "printable-tags hidden" : "grid")}>
      {items.map((item) => (
        <PriceTag key={item.id} item={item} />
      ))}
    </div>
  )
}
