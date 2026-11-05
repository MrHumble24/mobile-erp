export type AttributeType = "text" | "number" | "select"

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
  /** How customs writes this model; matched to the price list for the fee (ADR 0027). */
  customsCode: string | null
  attributes: AttributeDef[]
  createdAt: string
  updatedAt: string
}

export interface CreateDeviceModelDto {
  brand: string
  name: string
  isActive?: boolean
  customsCode?: string | null
  attributes?: AttributeDef[]
}

export interface UpdateDeviceModelDto {
  brand?: string
  name?: string
  isActive?: boolean
  customsCode?: string | null
  attributes?: AttributeDef[]
}
