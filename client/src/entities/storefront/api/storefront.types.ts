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

export interface StorefrontConfig {
  enabled: boolean
  shopName?: string
  contactPhone?: string | null
  contactTelegram?: string | null
  showPrices?: boolean
  stores?: StorefrontStoreSummary[]
  categories?: StorefrontCategorySummary[]
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
  categoryId: string
  categoryName: string
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
  storeId: string
  note?: string
  hp?: string
}

export interface StorefrontSettingsView {
  id: number
  enabled: boolean
  showPrices: boolean
  contactPhone: string | null
  contactTelegram: string | null
  categoryIds: string[]
}

export interface UpdateStorefrontSettingsDto {
  enabled?: boolean
  showPrices?: boolean
  contactPhone?: string | null
  contactTelegram?: string | null
  categoryIds?: string[]
}
