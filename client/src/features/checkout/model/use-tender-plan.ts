import * as React from "react"
import type { LevelCode } from "@/entities/pricing"
import { useCustomerBonus } from "@/entities/bonus"
import { useOnlineStatus } from "@/shared/lib/offline"
import { useCartStore } from "./cart.store"
import { useTradeInStore, type TradeInDraft } from "./trade-in.store"
import { useBonusRedeemStore } from "./bonus-redeem.store"
import { lineFinalPrice } from "../lib/line-pricing"
import { buildCartTradeInPlan, type CartTradeInPlan } from "./use-trade-in-plan"
import { planBonusRedeem, type RedeemPlan } from "../lib/bonus-redeem"
import type { LinePrice } from "../lib/payment"

type CartLines = ReturnType<typeof useCartStore.getState>["lines"]

export interface CartTenderPlan {
  /** The trade-ins first: their per-line allocation and amount to pay. */
  tradeIn: CartTradeInPlan
  /** The points on top of the trade-ins. */
  redeem: RedeemPlan
  /** Per line: due minus its points; what cash/card must cover. */
  payableLines: LinePrice[]
  /** Cart total after trade-ins and points. */
  amountToPay: number
}

export interface TenderBonusInput {
  requested: number
  balance: number
  maxPercent: number
  /** All of: a named customer, bonus enabled, and an online till. */
  allowed: boolean
}

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * Applies the points plan on top of the trade-in plan (ADR 0043): each line's
 * points are capped by its total and by what it still owes after its trade-ins.
 * Points are zero unless the customer, the shop setting and the connection all
 * allow them. Pure, so the checkout submit can run it on a store snapshot.
 */
export function buildCartTenderPlan(
  lines: CartLines,
  level: LevelCode,
  tradeIns: TradeInDraft[],
  bonus: TenderBonusInput
): CartTenderPlan {
  const tradeIn = buildCartTradeInPlan(lines, level, tradeIns)
  const dueById = new Map(tradeIn.payableLines.map((line) => [line.lineId, line.salePrice]))
  const redeemLines = lines.map((line) => ({
    lineId: line.lineId,
    price: lineFinalPrice(line, level),
    due: dueById.get(line.lineId) ?? 0,
  }))
  const redeem = planBonusRedeem(
    redeemLines,
    bonus.allowed ? bonus.requested : 0,
    bonus.allowed ? bonus.balance : 0,
    bonus.allowed ? bonus.maxPercent : 0
  )
  const amountToPay = redeem.payableLines.reduce((sum, line) => sum + line.salePrice, 0)
  return { tradeIn, redeem, payableLines: redeem.payableLines, amountToPay: round2(amountToPay) }
}

/** The cart's tender plan: trade-ins, then points, then cash/card. */
export function useCartTenderPlan(): CartTenderPlan {
  const lines = useCartStore((s) => s.lines)
  const level = useCartStore((s) => s.priceLevelCode)
  const customerId = useCartStore((s) => s.customer?.id)
  const tradeIns = useTradeInStore((s) => s.tradeIns)
  const requested = useBonusRedeemStore((s) => s.requested)
  const online = useOnlineStatus()
  const { data: bonus } = useCustomerBonus(customerId ?? "")

  return React.useMemo(() => {
    const allowed = Boolean(customerId) && Boolean(bonus?.enabled) && online
    return buildCartTenderPlan(lines, level, tradeIns, {
      requested,
      balance: Number(bonus?.balance ?? 0),
      maxPercent: Number(bonus?.maxRedeemPercent ?? 0),
      allowed,
    })
  }, [lines, level, customerId, tradeIns, requested, online, bonus?.enabled, bonus?.balance, bonus?.maxRedeemPercent])
}
