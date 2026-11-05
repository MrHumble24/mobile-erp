import { useSettings } from "@/entities/settings"
import type { DiscountRules } from "@/entities/pricing"
import { useCartStore } from "./cart.store"

export interface DiscountConfig {
  enabled: boolean
  rules: DiscountRules
  presetsPercent: number[]
  presetsAmount: number[]
}

/**
 * The discount settings and the effective rules for the current cart (ADR 0034):
 * the store's switches/presets/cashier-max, raised by the chosen customer's
 * standing discount and the caller's `sale.discount.unlimited`.
 */
export function useDiscountConfig(canDiscountUnlimited: boolean): DiscountConfig {
  const { data: settings } = useSettings()
  const standing = useCartStore((s) => Number(s.customer?.standingDiscountPercent ?? 0))
  const enabled = !!settings?.discountsEnabled
  return {
    enabled,
    rules: {
      enabled,
      percentAllowed: !!settings?.discountPercentAllowed,
      amountAllowed: !!settings?.discountAmountAllowed,
      maxPercent: Number(settings?.maxDiscountPercent ?? 0),
      standingPercent: standing,
      unlimited: canDiscountUnlimited,
    },
    presetsPercent: settings?.discountPresetsPercent ?? [],
    presetsAmount: settings?.discountPresetsAmount ?? [],
  }
}
