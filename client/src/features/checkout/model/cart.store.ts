import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unitCode } from "@/shared/lib/unit-code"
import type { DeviceDetailView } from "@/entities/device"
import type { StockScanProduct } from "@/entities/stock"
import type { PaymentMethod, PaymentPart } from "@/entities/ledger"
import type { Discount, LevelCode, LevelPrices } from "@/entities/pricing"
import { spreadCartDiscount } from "../lib/cart-discount"
import { lineListCents } from "../lib/line-pricing"
import { useBonusRedeemStore } from "./bonus-redeem.store"

export interface CartCustomer {
  id?: string
  name: string
  phone?: string
  /** The customer's default level and standing discount (ADR 0034). */
  priceLevelCode?: LevelCode
  standingDiscountPercent?: number
}

/** Fields every line carries for pricing (ADR 0034). */
interface LinePricing {
  /** Resolved list prices per level (per-piece for a quantity line); undefined = shop set none. */
  listPrices?: LevelPrices
  /** A discount off the list price, or null. */
  discount: Discount | null
  /** A `sale.price.override` cashier typed a free price: ignore list + discount. */
  overrideActive: boolean
}

/** A phone or serial unit line: priced as a whole, with warranty (ADR 0029). */
export interface UnitCartLine extends LinePricing {
  kind: "unit"
  lineId: string
  device: DeviceDetailView
  /** The typed price, used when there is no list price or an override is active. */
  salePrice: number
  warrantyDays: number
  notes: string
  clientMutationId: string
  belowCostConfirmed: boolean
}

/** A quantity-product line: pieces × a per-piece price, no warranty (ADR 0030). */
export interface QuantityCartLine extends LinePricing {
  kind: "quantity"
  lineId: string
  modelId: string
  name: string
  barcode: string | null
  /** Typed per-piece price, used when there is no list price or an override. */
  unitPrice: number
  quantity: number
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
  /** The level every line is priced at; follows the customer, seller may switch. */
  priceLevelCode: LevelCode
  paymentMethod: PaymentMethod
  splitParts: PaymentPart[]
  addLine: (device: DeviceDetailView, defaults: LineDefaults) => boolean
  addProduct: (product: StockScanProduct) => void
  removeLine: (lineId: string) => void
  removeLastLine: () => void
  setLinePrice: (lineId: string, salePrice: number) => void
  setLineQuantity: (lineId: string, quantity: number) => void
  setLineUnitPrice: (lineId: string, unitPrice: number) => void
  setLineWarranty: (lineId: string, warrantyDays: number) => void
  setLineNotes: (lineId: string, notes: string) => void
  setLineBelowCostConfirmed: (lineId: string, confirmed: boolean) => void
  setLineDiscount: (lineId: string, discount: Discount | null) => void
  setLineOverride: (lineId: string, active: boolean) => void
  setPriceLevel: (level: LevelCode) => void
  /** Spread a whole-cart discount into per-line AMOUNT discounts, cent-exact. */
  applyCartDiscount: (discount: Discount | null) => void
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

function withLines(lines: CartLine[]) {
  return lines.length > 0
    ? { lines }
    : { lines, paymentMethod: "cash" as PaymentMethod, splitParts: [] as PaymentPart[] }
}

/** Prefill the standing discount (percent) on every line, or clear line discounts. */
function applyStanding(lines: CartLine[], standing: number): CartLine[] {
  const discount: Discount | null = standing > 0 ? { mode: "PERCENT", value: standing } : null
  return lines.map((line) => ({ ...line, discount }) as CartLine)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customer: null,
      priceLevelCode: "RETAIL",
      paymentMethod: "cash",
      splitParts: [],

      addLine: (device, defaults) => {
        const code = unitCode(device)
        if (get().lines.some((l) => l.kind === "unit" && unitCode(l.device) === code)) return false
        const line: UnitCartLine = {
          kind: "unit",
          lineId: newId(),
          device,
          salePrice: device.targetPrice ? Number(device.targetPrice) : 0,
          warrantyDays: defaults.warrantyDays,
          notes: "",
          clientMutationId: newId(),
          belowCostConfirmed: false,
          listPrices: device.prices,
          discount: null,
          overrideActive: false,
        }
        set((state) => ({ lines: [...state.lines, line] }))
        return true
      },

      addProduct: (product) => {
        const existing = get().lines.find(
          (l) => l.kind === "quantity" && l.modelId === product.modelId
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
          listPrices: product.prices,
          discount: null,
          overrideActive: false,
        }
        set((state) => ({ lines: [...state.lines, line] }))
      },

      removeLine: (lineId) =>
        set((state) => withLines(state.lines.filter((l) => l.lineId !== lineId))),
      removeLastLine: () => set((state) => withLines(state.lines.slice(0, -1))),
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
      setLineDiscount: (lineId, discount) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { discount }) })),
      setLineOverride: (lineId, overrideActive) =>
        set((state) => ({ lines: mapLine(state.lines, lineId, { overrideActive }) })),

      setPriceLevel: (priceLevelCode) => set({ priceLevelCode }),

      applyCartDiscount: (discount) =>
        set((state) => {
          const level = state.priceLevelCode
          const listCents = state.lines.map((l) => Math.max(0, lineListCents(l, level) ?? 0))
          const total = listCents.reduce((s, c) => s + c, 0)
          const cartCents =
            !discount || discount.value <= 0 || total <= 0
              ? 0
              : discount.mode === "PERCENT"
                ? Math.min(Math.round((total * discount.value) / 100), total)
                : Math.min(Math.round(discount.value * 100), total)
          const shares = spreadCartDiscount(listCents, cartCents)
          return {
            lines: state.lines.map((l, i) => ({
              ...l,
              discount: shares[i] > 0 ? { mode: "AMOUNT", value: shares[i] / 100 } : null,
            }) as CartLine),
          }
        }),

      setCustomer: (customer) =>
        set((state) => ({
          customer,
          priceLevelCode: customer?.priceLevelCode ?? "RETAIL",
          lines: customer
            ? applyStanding(state.lines, customer.standingDiscountPercent ?? 0)
            : applyStanding(state.lines, 0),
        })),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setSplitParts: (splitParts) => set({ splitParts }),
      clear: () => {
        useBonusRedeemStore.getState().reset()
        set({
          lines: [],
          customer: null,
          priceLevelCode: "RETAIL",
          paymentMethod: "cash",
          splitParts: [],
        })
      },
    }),
    {
      name: "mobile-erp-pos-cart",
      version: 2,
      migrate: (persisted: unknown, version) => {
        const state = persisted as CartState | undefined
        if (!state) return state as unknown as CartState
        let raw = (state.lines ?? []) as unknown as Record<string, unknown>[]
        // v0 carts held only unit lines without a `kind` tag.
        if (version === 0) {
          raw = raw.map((l) => ("kind" in l ? l : { ...l, kind: "unit" }))
        }
        // v1 → v2: pricing fields did not exist; default them without clobbering.
        state.lines = raw.map(
          (l) => ({ discount: null, overrideActive: false, ...l }) as unknown as CartLine
        )
        state.priceLevelCode ??= "RETAIL"
        return state as CartState
      },
    }
  )
)
