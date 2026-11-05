export type AttributeType = "text" | "number" | "select"

/** How a product's units are stocked (ADR 0029). */
export type ProductKind = "IMEI" | "SERIAL" | "QUANTITY"

/** One spec field defined on a device model (mirrors the server AttributeDef). */
export interface AttributeDef {
  key: string
  label: string
  type: AttributeType
  options: string[]
  required: boolean
  sortOrder: number
}

export interface DeviceModelView {
  id: string
  brand: string
  name: string
  isActive: boolean
  /** How this product's units are stocked; cannot change once it has units. */
  kindCode: ProductKind
  categoryId: string | null
  /** Box EAN; unique. */
  barcode: string | null
  /** Maker's code, e.g. A2894 / SM-S918B; indexed for search. */
  modelCode: string | null
  /** How customs writes this model; matched to the price list for the fee (ADR 0027). */
  customsCode: string | null
  /** Default till price per piece for a QUANTITY product (2-dp string); null when unset (ADR 0030). */
  salePrice: string | null
  attributes: AttributeDef[]
  createdAt: string
  updatedAt: string
}

export interface CreateDeviceModelDto {
  brand: string
  name: string
  isActive?: boolean
  /** Defaults to IMEI server-side. */
  kindCode?: ProductKind
  categoryId?: string | null
  barcode?: string | null
  modelCode?: string | null
  customsCode?: string | null
  /** Default till price per piece for a QUANTITY product; null clears it (ADR 0030). */
  salePrice?: number | null
  attributes?: AttributeDef[]
}

export interface UpdateDeviceModelDto {
  brand?: string
  name?: string
  isActive?: boolean
  kindCode?: ProductKind
  categoryId?: string | null
  barcode?: string | null
  modelCode?: string | null
  customsCode?: string | null
  salePrice?: number | null
  attributes?: AttributeDef[]
}
