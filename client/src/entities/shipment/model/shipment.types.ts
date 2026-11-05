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
  /** Sum of the quantity purchase lines; cost-restricted (absent without permission). */
  stockLinesTotal?: string
  /** The shipment's quantity purchases, built from its PURCHASE stock movements (ADR 0034). GET /:id only. */
  stockLines?: ShipmentStockLine[]
}

/** One quantity purchase into a shipment. `unitCost`/`lineTotal` null without cost permission. */
export interface ShipmentStockLine {
  id: string
  modelId: string
  brand: string
  name: string
  quantity: number
  unitCost: string | null
  lineTotal: string | null
  occurredAt: string
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
  /** Exactly one of imei / serialNumber per the model's kind (ADR 0029). */
  imei?: string
  imei2?: string | null
  serialNumber?: string
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
  imei: string | null
  imei2: string | null
  serialNumber: string | null
  kindCode: string
  modelId: string
  acquisitionCost: string
  /** Customs fee stamped by the server from the current list. */
  customsFee: string
  unitExpense: string
  landedCost: string
  targetPrice: string | null
  statusCode: string
}
