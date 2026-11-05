import * as React from "react"
import type { LevelCode } from "@/entities/pricing"
import { useCartStore } from "./cart.store"
import { useTradeInStore, type TradeInDraft } from "./trade-in.store"
import { lineFinalPrice } from "../lib/line-pricing"
import { planTradeIns, type TradeInPlan } from "../lib/trade-in-plan"

export interface CartTradeInPlan extends TradeInPlan {
  /** The trade-in no single line could carry, resolved to its draft (when !ok). */
  unplaceable?: TradeInDraft
}

/** Plans the cart's trade-ins over its lines: amount to pay + per-line payable. */
export function useCartTradeInPlan(): CartTradeInPlan {
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)
  const tradeIns = useTradeInStore((s) => s.tradeIns)
  return React.useMemo(() => buildCartTradeInPlan(lines, level, tradeIns), [lines, level, tradeIns])
}

/** Non-hook form, for the checkout submit which reads a store snapshot. */
export function buildCartTradeInPlan(
  lines: ReturnType<typeof useCartStore.getState>["lines"],
  level: LevelCode,
  tradeIns: TradeInDraft[]
): CartTradeInPlan {
  const allocLines = lines.map((l) => ({ lineId: l.lineId, price: lineFinalPrice(l, level) }))
  const plan = planTradeIns(allocLines, tradeIns.map((t) => ({ id: t.id, value: t.value })))
  const unplaceable = plan.unplaceableId ? tradeIns.find((t) => t.id === plan.unplaceableId) : undefined
  return { ...plan, unplaceable }
}
