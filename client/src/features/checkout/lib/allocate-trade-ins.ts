/**
 * The web till posts one sale per cart line, but a trade-in belongs to one sale
 * and its value may not exceed that sale's price (ADR 0039). This attaches each
 * trade-in to a line that can carry it — largest trade-in first, onto the line
 * with the largest remaining price — so the payments sent for a line are its
 * price minus the trade-ins put on it. If a trade-in fits no single line, the
 * caller must refuse before sending (`ok: false`).
 */

export interface AllocLine {
  lineId: string
  /** The line's final sale price, major units. */
  price: number
}

export interface AllocItem {
  id: string
  /** The trade-in's agreed value, major units. */
  value: number
}

export interface TradeInAllocation {
  ok: boolean
  /** lineId → total trade-in value put on it (major units). */
  valueByLine: Record<string, number>
  /** lineId → trade-in item ids put on it. */
  itemsByLine: Record<string, string[]>
  /** The first trade-in no single line could carry; set only when `ok` is false. */
  unplaceableId?: string
}

const toCents = (n: number): number => Math.round(n * 100)

export function allocateTradeIns(lines: AllocLine[], items: AllocItem[]): TradeInAllocation {
  const remaining = new Map(lines.map((l) => [l.lineId, toCents(l.price)]))
  const valueCents: Record<string, number> = {}
  const itemsByLine: Record<string, string[]> = {}
  for (const l of lines) itemsByLine[l.lineId] = []

  // Largest trade-in first, so a big trade-in claims a big line before small ones.
  const ordered = [...items].sort((a, b) => b.value - a.value)
  for (const item of ordered) {
    const cents = toCents(item.value)
    let bestLine: string | null = null
    let bestRemaining = -1
    for (const [lineId, rem] of remaining) {
      if (rem >= cents && rem > bestRemaining) {
        bestLine = lineId
        bestRemaining = rem
      }
    }
    if (bestLine === null) {
      return { ok: false, valueByLine: {}, itemsByLine: {}, unplaceableId: item.id }
    }
    remaining.set(bestLine, bestRemaining - cents)
    valueCents[bestLine] = (valueCents[bestLine] ?? 0) + cents
    itemsByLine[bestLine].push(item.id)
  }

  const valueByLine: Record<string, number> = {}
  for (const [lineId, cents] of Object.entries(valueCents)) valueByLine[lineId] = cents / 100
  return { ok: true, valueByLine, itemsByLine }
}

/** Σ trade-in values, cents-safe (the amount netted off what the customer pays). */
export function tradeInsTotal(items: { value: number }[]): number {
  return items.reduce((sum, i) => sum + toCents(i.value), 0) / 100
}
