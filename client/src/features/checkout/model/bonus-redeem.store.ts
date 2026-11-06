import { create } from "zustand"

interface BonusRedeemState {
  /** Points the cashier asked to spend on this cart. */
  requested: number
  setRequested: (requested: number) => void
  reset: () => void
}

/** The cart's points request; deliberately not persisted (a new till starts at 0). */
export const useBonusRedeemStore = create<BonusRedeemState>()((set) => ({
  requested: 0,
  setRequested: (requested) => set({ requested }),
  reset: () => set({ requested: 0 }),
}))
