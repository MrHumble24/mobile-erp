import { create } from "zustand"
import type { DeviceDetailView } from "@/entities/device"

export interface CartCustomer {
  id?: string
  name: string
  phone?: string
}

export interface CartState {
  device: DeviceDetailView | null
  salePrice: number
  customer: CartCustomer | null
  warrantyDays: number
  notes: string
  clientMutationId: string
  setDevice: (device: DeviceDetailView | null, defaultWarranty?: number) => void
  setSalePrice: (price: number) => void
  setCustomer: (customer: CartCustomer | null) => void
  setWarrantyDays: (days: number) => void
  setNotes: (notes: string) => void
  resetCart: () => void
}

function newMutationId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `mut_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const useCartStore = create<CartState>((set) => ({
  device: null,
  salePrice: 0,
  customer: null,
  warrantyDays: 14,
  notes: "",
  clientMutationId: newMutationId(),

  setDevice: (device, defaultWarranty = 14) =>
    set({
      device,
      salePrice: device?.targetPrice ? Number(device.targetPrice) : 0,
      warrantyDays: defaultWarranty,
      clientMutationId: newMutationId(),
    }),

  setSalePrice: (salePrice) => set({ salePrice }),
  setCustomer: (customer) => set({ customer }),
  setWarrantyDays: (warrantyDays) => set({ warrantyDays }),
  setNotes: (notes) => set({ notes }),

  resetCart: () =>
    set({
      device: null,
      salePrice: 0,
      customer: null,
      warrantyDays: 14,
      notes: "",
      clientMutationId: newMutationId(),
    }),
}))
