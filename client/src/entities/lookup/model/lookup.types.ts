/** How a product's units are stocked (ADR 0029); declared locally to keep the
 * lookup entity independent of the sibling device-model entity. */
type ProductKind = "IMEI" | "SERIAL" | "QUANTITY"

/** Which free list answered, and its licence (shown as a credit). */
export interface LookupSource {
  name: string
  license: string
}

/** What the reference lists know about the code (fields may be null). */
export interface LookupReference {
  brand: string
  model: string
  color: string | null
  storage: string | null
  ram: string | null
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

/** Teach which of our products a reference model is (POST /lookup/links). */
export interface TeachLinkDto {
  refBrand: string
  refModel: string
  modelId: string
}
