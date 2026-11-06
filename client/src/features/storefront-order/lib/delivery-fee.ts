export interface DeliveryZoneOption {
  id: string
  name: string
  fee: string | number
  isActive?: boolean
}

export interface ClientDeliveryFeeInput {
  fulfillmentMethod: "PICKUP" | "DELIVERY"
  pickupEnabled: boolean
  deliveryEnabled: boolean
  pricingMode: "FREE" | "FLAT" | "BY_ZONE" | string
  flatFee?: string | number | null
  freeFrom?: string | number | null
  orderPrice?: string | number | null
  zone?: DeliveryZoneOption | null
}

/**
 * Pure calculation of storefront delivery fee matching the server implementation.
 * - PICKUP: 0
 * - DELIVERY with price >= freeFrom threshold: 0
 * - Otherwise determined by pricingMode (FREE: 0, FLAT: flatFee, BY_ZONE: zone.fee).
 */
export function calculateDeliveryFee(input: ClientDeliveryFeeInput): number {
  if (input.fulfillmentMethod === "PICKUP") return 0
  if (!input.deliveryEnabled) return 0

  const price = Number(input.orderPrice ?? 0)
  const freeFrom =
    input.freeFrom !== null && input.freeFrom !== undefined
      ? Number(input.freeFrom)
      : null

  if (
    freeFrom !== null &&
    !isNaN(freeFrom) &&
    freeFrom > 0 &&
    price >= freeFrom
  ) {
    return 0
  }

  const mode = input.pricingMode.toUpperCase()
  if (mode === "FREE") return 0
  if (mode === "FLAT") {
    return Number(input.flatFee ?? 0)
  }
  if (mode === "BY_ZONE") {
    return Number(input.zone?.fee ?? 0)
  }
  return 0
}
