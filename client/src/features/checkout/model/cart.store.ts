import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DeviceDetailView } from "@/entities/device"
import type { PaymentMethod, PaymentPart } from "@/entities/ledger"

export interface CartCustomer {
  id?: string
  name: string
  phone?: string
}

export interface CartLine {
  lineId: string
  device: DeviceDetailView
  salePrice: number
  warrantyDays: number
  notes: string
  clientMutationId: string
  belowCostConfirmed: boolean
}

export interface LineDefaults {
  warrantyDays: number
}

export interface CartState {
  lines: CartLine[]
  customer: CartCustomer | null
  /** How the whole cart is tendered. Split is only valid for a single line. */
  paymentMethod: PaymentMethod
  /** Per-account amounts when paymentMethod is "split". */
  splitParts: PaymentPart[]
  /** Adds a device line. Returns false if the IMEI is already in the cart. */
  addLine: (device: DeviceDetailView, defaults: LineDefaults) => boolean
  removeLine: (lineId: string) => void
  removeLastLine: () => void
  setLinePrice: (lineId: string, salePrice: number) => void
  setLineWarranty: (lineId: string, warrantyDays: number) => void
  setLineNotes: (lineId: string, notes: string) => void
  setLineBelowCostConfirmed: (lineId: string, confirmed: boolean) => void
  setCustomer: (customer: CartCustomer | null) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setSplitParts: (parts: PaymentPart[]) => void
  clear: () => void
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function mapLine(lines: CartLine[], lineId: string, patch: Partial<CartLine>): CartLine[] {
  return lines.map((line) => (line.lineId === lineId ? { ...line, ...patch } : line))
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customer: null,
      paymentMethod: "cash",
      splitParts: [],

      addLine: (device, defaults) => {
        if (get().lines.some((line) => line.device.imei === device.imei)) return false
        const line: CartLine = {
          lineId: newId(),
          device,
          salePrice: device.targetPrice ? Number(device.targetPrice) : 0,
          warrantyDays: defaults.warrantyDays,
          notes: "",
          clientMutationId: newId(),
          belowCostConfirmed: false,
        }
        set((state) => ({ lines: [...state.lines, line] }))
        return true
      },

      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.lineId !== lineId) })),

      removeLastLine: () => set((state) => ({ lines: state.lines.slice(0, -1) })),

      setLinePrice: (lineId, salePrice) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { salePrice }) })),

      setLineWarranty: (lineId, warrantyDays) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { warrantyDays }) })),

      setLineNotes: (lineId, notes) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { notes }) })),

      setLineBelowCostConfirmed: (lineId, belowCostConfirmed) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { belowCostConfirmed }) })),

      setCustomer: (customer) => set({ customer }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      setSplitParts: (splitParts) => set({ splitParts }),

      clear: () =>
        set({ lines: [], customer: null, paymentMethod: "cash", splitParts: [] }),
    }),
    { name: "mobile-erp-pos-cart" }
  )
)
