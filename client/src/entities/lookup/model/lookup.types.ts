/** How a product's units are stocked (ADR 0029); declared locally to keep the
 * lookup entity independent of the sibling device-model entity. */
type ProductKind = "IMEI" | "SERIAL" | "QUANTITY"

/** Which free list answered, and its licence (shown as a credit). */
export interface LookupSource {
  name: string
  license: string
}

/** What the reference list knows about individual variants (e.g. for Apple A-numbers). */
export interface LookupVariant {
  color: string | null
  storage: string | null
  ram: string | null
  boxCode: string | null
}

/** What the reference lists know about the code (fields may be null). */
export interface LookupReference {
  brand: string
  model: string
  color: string | null
  storage: string | null
  ram: string | null
  modelNumber?: string | null
  modelCode?: string | null
  storageOptions?: string[]
  colorOptions?: string[]
  variants?: LookupVariant[]
}

/** Our catalog product the lists point at, when one is known. */
export interface LookupProduct {
  modelId: string
  brand: string
  name: string
  kindCode: ProductKind
  /** "link" | "modelCode" | "name" — how we matched it (informational). */
  matchedBy: string
  /** The product's own option matching the reference storage/colour, or null. */
  storageOption: string | null
  colorOption: string | null
}

export interface LookupResult {
  source: LookupSource
  reference: LookupReference
  product: LookupProduct | null
}

export interface LookupSearchResult {
  brand: string
  model: string
  series?: string | null
  modelCode?: string | null
  kindCode: ProductKind
  storageOptions: string[]
  colorOptions: string[]
}

/** Teach which of our products a reference model is (POST /lookup/links). */
export interface TeachLinkDto {
  refBrand: string
  refModel: string
  modelId: string
}
