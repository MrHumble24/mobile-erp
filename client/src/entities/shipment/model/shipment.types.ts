export interface ShipmentView {
  id: string
  supplierId: string
  shipmentDate: string
  expectedCount: number
  overheadCost: string
  notes: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  deviceCount: number
  /** Account the purchase + overhead money left from; fixed at creation. */
  paymentAccountCode: string
}

export interface CreateShipmentDto {
  supplierId: string
  shipmentDate: string
  expectedCount: number
  overheadCost?: number
  notes?: string
  /** Fixed after creation; defaults to CASH server-side. */
  paymentAccountCode?: string
}

export interface UpdateShipmentDto {
  shipmentDate?: string
  expectedCount?: number
  overheadCost?: number
  notes?: string
}

export interface RegisterDeviceItem {
  imei: string
  imei2?: string | null
  modelId: string
  specs: Record<string, unknown>
  acquisitionCost: number
  targetPrice?: number
}

export interface RegisterDevicesDto {
  devices: RegisterDeviceItem[]
}

export interface RegisteredDeviceView {
  id: string
  imei: string
  imei2: string | null
  modelId: string
  acquisitionCost: string
  landedCost: string
  targetPrice: string | null
  statusCode: string
}
