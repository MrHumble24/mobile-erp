import { create } from "zustand"
import { persist } from "zustand/middleware"

/** How the seller enters products at the till. */
export type InputMode = "scan" | "catalog"

interface PosPrefsState {
  inputMode: InputMode
  setInputMode: (mode: InputMode) => void
}

/** Per-browser till preferences (ADR 0031). Only the chosen input mode so far. */
export const usePosPrefsStore = create<PosPrefsState>()(
  persist(
    (set) => ({
      inputMode: "scan",
      setInputMode: (inputMode) => set({ inputMode }),
    }),
    { name: "mobile-erp-pos-prefs", version: 1 }
  )
)
