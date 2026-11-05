import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unitCode } from "@/shared/lib/unit-code"
import type { DeviceDetailView } from "@/entities/device"
import type { StockScanProduct } from "@/entities/stock"
import type { PaymentMethod, PaymentPart } from "@/entities/ledger"

export interface CartCustomer {
  id?: string
  name: string
  phone?: string
}

/** A phone or serial unit line: priced as a whole, with warranty (ADR 0029). */
export interface UnitCartLine {
  kind: "unit"
  lineId: string
  device: DeviceDetailView
  salePrice: number
  warrantyDays: number
  notes: string
  clientMutationId: string
  belowCostConfirmed: boolean
}

/** A quantity-product line: pieces × a per-piece price, no warranty (ADR 0030). */
export interface QuantityCartLine {
  kind: "quantity"
  lineId: string
  modelId: string
  name: string
  barcode: string | null
  /** Editable price per piece; the line total is `unitPrice × quantity`. */
  unitPrice: number
  quantity: number
  /** Stock on hand when added, for the over-stock warning (sale is never blocked). */
  onHand: number
  notes: string
  clientMutationId: string
}

export type CartLine = UnitCartLine | QuantityCartLine

export interface LineDefaults {
  warrantyDays: number
}

export interface CartState {
  lines: CartLine[]
  customer: CartCustomer | null
  /** How the whole cart is tendered. Split allocates the cart total line by line. */
  paymentMethod: PaymentMethod
  /** Per-account amounts when paymentMethod is "split". */
  splitParts: PaymentPart[]
  /** Adds a device line. Returns false if that unit is already in the cart. */
  addLine: (device: DeviceDetailView, defaults: LineDefaults) => boolean
  /** Adds a quantity product, or raises the quantity if it is already in the cart. */
  addProduct: (product: StockScanProduct) => void
  removeLine: (lineId: string) => void
  removeLastLine: () => void
  setLinePrice: (lineId: string, salePrice: number) => void
  setLineQuantity: (lineId: string, quantity: number) => void
  setLineUnitPrice: (lineId: string, unitPrice: number) => void
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
  return lines.map((line) =>
    line.lineId === lineId ? ({ ...line, ...patch } as CartLine) : line
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customer: null,
      paymentMethod: "cash",
      splitParts: [],

      addLine: (device, defaults) => {
        const code = unitCode(device)
        if (
          get().lines.some((line) => line.kind === "unit" && unitCode(line.device) === code)
        )
          return false
        const line: UnitCartLine = {
          kind: "unit",
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

      addProduct: (product) => {
        const existing = get().lines.find(
          (line) => line.kind === "quantity" && line.modelId === product.modelId
        )
        if (existing) {
          set((state) => ({
            lines: mapLine(state.lines, existing.lineId, {
              quantity: (existing as QuantityCartLine).quantity + 1,
            }),
          }))
          return
        }
        const line: QuantityCartLine = {
          kind: "quantity",
          lineId: newId(),
          modelId: product.modelId,
          name: `${product.brand} ${product.name}`.trim(),
          barcode: product.barcode,
          unitPrice: product.salePrice ? Number(product.salePrice) : 0,
          quantity: 1,
          onHand: product.quantity,
          notes: "",
          clientMutationId: newId(),
        }
        set((state) => ({ lines: [...state.lines, line] }))
      },

      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.lineId !== lineId) })),

      removeLastLine: () => set((state) => ({ lines: state.lines.slice(0, -1) })),

      setLinePrice: (lineId, salePrice) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { salePrice }) })),

      setLineQuantity: (lineId, quantity) =>
        set((state) => ({
          lines: mapLine(state.lines, lineId, { quantity: Math.max(1, Math.trunc(quantity)) }),
        })),

      setLineUnitPrice: (lineId, unitPrice) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { unitPrice }) })),

      setLineWarranty: (lineId, warrantyDays) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { warrantyDays }) })),

      setLineNotes: (lineId, notes) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { notes }) })),

      setLineBelowCostConfirmed: (lineId, belowCostConfirmed) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { belowCostConfirmed }) })),

      setCustomer: (customer) => set({ customer }),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      setSplitParts: (splitParts) => set({ splitParts }),

      clear: () => set({ lines: [], customer: null, paymentMethod: "cash", splitParts: [] }),
    }),
    {
      name: "mobile-erp-pos-cart",
      version: 1,
      // v0 carts held only unit lines without a `kind` tag.
      migrate: (persisted: unknown, version) => {
        const state = persisted as CartState | undefined
        if (version === 0 && state && Array.isArray(state.lines)) {
          const raw = state.lines as unknown as Record<string, unknown>[]
          state.lines = raw.map(
            (line) => (("kind" in line ? line : { ...line, kind: "unit" }) as unknown as CartLine)
          )
        }
        return state as CartState
      },
    }
  )
)
