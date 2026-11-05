import { create } from "zustand"
import { persist } from "zustand/middleware"

/** One phone the customer gives in part payment, held as a cart draft (ADR 0039). */
export interface TradeInDraft {
  id: string
  modelId: string
  /** "Brand Name", for display in the cart rows. */
  modelLabel: string
  imei?: string
  imei2?: string
  serialNumber?: string
  specs?: Record<string, unknown>
  value: number
}

interface TradeInState {
  tradeIns: TradeInDraft[]
  addTradeIn: (t: Omit<TradeInDraft, "id">) => void
  removeTradeIn: (id: string) => void
  /** Drop the trade-ins already sent with a committed sale line. */
  removeMany: (ids: string[]) => void
  clear: () => void
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ti_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const useTradeInStore = create<TradeInState>()(
  persist(
    (set) => ({
      tradeIns: [],
      addTradeIn: (t) => set((s) => ({ tradeIns: [...s.tradeIns, { ...t, id: newId() }] })),
      removeTradeIn: (id) => set((s) => ({ tradeIns: s.tradeIns.filter((t) => t.id !== id) })),
      removeMany: (ids) =>
        set((s) => ({ tradeIns: s.tradeIns.filter((t) => !ids.includes(t.id)) })),
      clear: () => set({ tradeIns: [] }),
    }),
    { name: "mobile-erp-pos-tradeins" }
  )
)
