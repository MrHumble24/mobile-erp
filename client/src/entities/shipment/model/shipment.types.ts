export interface ShipmentView {
  id: string
  supplierId: string
  shipmentDate: string
  expectedCount: number
  notes: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  deviceCount: number
  /** Account the purchase + per-phone expense money left from; fixed at creation. */
  paymentAccountCode: string
  /** Sum of its phones' expenses; absent for callers without cost permission. */
  unitExpenseTotal?: string
  /** Sum of its phones' customs fees; absent for callers without cost permission. */
  customsFeeTotal?: string
  /** Count of its phones whose customs fee is 0 — drives a warning. */
  devicesWithoutCustomsFee: number
}

export interface CreateShipmentDto {
  supplierId: string
  shipmentDate: string
  expectedCount: number
  notes?: string
  /** Fixed after creation; defaults to CASH server-side. */
  paymentAccountCode?: string
}

export interface UpdateShipmentDto {
  shipmentDate?: string
  expectedCount?: number
  notes?: string
}

export interface RegisterDeviceItem {
  imei: string
  imei2?: string | null
  modelId: string
  specs: Record<string, unknown>
  acquisitionCost: number
  targetPrice?: number
  /** Per-phone expense; needs `device.expense` when non-zero. */
  unitExpense?: number
  unitExpenseNote?: string
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
  /** Customs fee stamped by the server from the current list. */
  customsFee: string
  unitExpense: string
  landedCost: string
  targetPrice: string | null
  statusCode: string
}
