export interface StorefrontStoreSummary {
  id: string
  name: string
  address?: string | null
  phone?: string | null
}

export interface StorefrontCategorySummary {
  id: string
  name: string
}

export interface StorefrontDeliveryZoneView {
  id: string
  name: string
  fee: string
  sortOrder: number
  isActive?: boolean
}

export interface StorefrontPaymentProviderView {
  code: string
  label: string
}

export interface StorefrontConfig {
  enabled: boolean
  shopName?: string
  contactPhone?: string | null
  contactTelegram?: string | null
  showPrices?: boolean
  stores?: StorefrontStoreSummary[]
  categories?: StorefrontCategorySummary[]
  pickupEnabled?: boolean
  deliveryEnabled?: boolean
  deliveryPricingMode?: string
  deliveryFlatFee?: string | null
  deliveryFreeFrom?: string | null
  deliveryNote?: string | null
  deliveryZones?: StorefrontDeliveryZoneView[]
  paymentProviders?: StorefrontPaymentProviderView[]
}

export interface StorefrontStoreStock {
  id: string
  name: string
  count: number
}

export interface StorefrontVariantView {
  specs: Record<string, string>
  price: string | null
  count: number
  stores: StorefrontStoreStock[]
}

export interface StorefrontProductCard {
  modelId: string
  brand: string
  name: string
  categoryId: string | null
  categoryName: string | null
  imageUrl: string | null
  priceFrom: string | null
  inStock: number
  stores: Array<{ id: string; name: string }>
}

export interface StorefrontProductDetail extends StorefrontProductCard {
  variants: StorefrontVariantView[]
}

export interface CreateStorefrontOrderDto {
  name: string
  phone: string
  modelId: string
  specs?: Record<string, string>
  storeId?: string
  note?: string
  hp?: string
  fulfillmentMethod?: "PICKUP" | "DELIVERY"
  paymentMethod?: "ON_RECEIPT" | "ONLINE"
  address?: string
  deliveryZoneId?: string
}

export interface StorefrontSettingsView {
  id?: number
  enabled: boolean
  showPrices: boolean
  contactPhone: string | null
  contactTelegram: string | null
  categoryIds: string[]
  pickupEnabled?: boolean
  deliveryEnabled?: boolean
  deliveryPricingModeCode?: string
  deliveryFlatFee?: string | null
  deliveryFreeFrom?: string | null
  deliveryNote?: string | null
}

export interface UpdateStorefrontSettingsDto {
  enabled?: boolean
  showPrices?: boolean
  contactPhone?: string | null
  contactTelegram?: string | null
  categoryIds?: string[]
  pickupEnabled?: boolean
  deliveryEnabled?: boolean
  deliveryPricingModeCode?: string
  deliveryFlatFee?: number | string | null
  deliveryFreeFrom?: number | string | null
  deliveryNote?: string | null
}

export interface CreateDeliveryZoneDto {
  name: string
  fee: number
  sortOrder?: number
}

export interface UpdateDeliveryZoneDto {
  name?: string
  fee?: number
  isActive?: boolean
  sortOrder?: number
}

export interface PublicStorefrontOrderView {
  id: string
  statusCode: string
  statusLabel: string
  fulfillmentMethod: string
  productName: string
  priceSnapshot: string | null
  deliveryFeeSnapshot: string
  paymentMethod: string
  paid: boolean
}
