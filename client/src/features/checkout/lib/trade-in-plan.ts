import type { LinePrice } from "./payment"
import { allocateTradeIns, tradeInsTotal, type AllocItem, type AllocLine } from "./allocate-trade-ins.ts"

const round2 = (n: number): number => Math.round(n * 100) / 100

export interface TradeInPlan {
  /** False when a trade-in fits no single line; checkout must refuse. */
  ok: boolean
  /** Σ trade-in values (major units). */
  tradeInTotal: number
  /** Cart total − trade-ins: what the customer still tenders. */
  amountToPay: number
  /** Per line, its price minus the trade-ins put on it — the payment maths basis. */
  payableLines: LinePrice[]
  /** lineId → trade-in item ids attached to that line. */
  itemsByLine: Record<string, string[]>
  /** The trade-in no single line could carry; set only when `ok` is false. */
  unplaceableId?: string
}

/**
 * Plans the trade-ins over the cart lines (ADR 0039): allocates each trade-in to
 * a line that can carry it, then derives the per-line payable (price − its
 * trade-ins) and the amount the customer still pays. Pure, so it is unit-tested
 * on plain numbers without a React cart.
 */
export function planTradeIns(lines: AllocLine[], items: AllocItem[]): TradeInPlan {
  const dueTotal = lines.reduce((sum, l) => sum + l.price, 0)
  const total = tradeInsTotal(items)
  const base = (): LinePrice[] => lines.map((l) => ({ lineId: l.lineId, salePrice: round2(l.price) }))

  if (items.length === 0) {
    return { ok: true, tradeInTotal: 0, amountToPay: round2(dueTotal), payableLines: base(), itemsByLine: {} }
  }
  const alloc = allocateTradeIns(lines, items)
  if (!alloc.ok) {
    return {
      ok: false,
      tradeInTotal: total,
      amountToPay: round2(dueTotal - total),
      payableLines: base(),
      itemsByLine: {},
      unplaceableId: alloc.unplaceableId,
    }
  }
  const payableLines = lines.map((l) => ({
    lineId: l.lineId,
    salePrice: round2(l.price - (alloc.valueByLine[l.lineId] ?? 0)),
  }))
  return {
    ok: true,
    tradeInTotal: total,
    amountToPay: round2(dueTotal - total),
    payableLines,
    itemsByLine: alloc.itemsByLine,
  }
}
