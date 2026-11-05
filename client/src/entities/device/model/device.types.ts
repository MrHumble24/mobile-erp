export type DeviceStatus = "IN_STOCK" | "DEFECTIVE" | "CONSIGNED" | "SOLD"

export interface DeviceSpecs {
  storage?: string
  color?: string
  ram?: string
  condition?: string
  [key: string]: unknown
}

export interface DeviceView {
  id: string
  /** Exactly one of imei / serialNumber is set (ADR 0029). */
  imei: string | null
  imei2: string | null
  serialNumber: string | null
  shipmentId: string
  modelId: string
  specs: DeviceSpecs
  acquisitionCost?: string
  /** Customs fee stamped at intake; cost-restricted (absent without permission). */
  customsFee?: string
  /** Per-phone expense; cost-restricted. */
  unitExpense?: string
  unitExpenseNote?: string | null
  landedCost?: string
  targetPrice: string | null
  statusCode: DeviceStatus | string
  intakeDate: string
  version: number
  createdAt: string
  updatedAt: string
  /** Present on list rows: the device's most recent QC summary, or null. */
  latestInspection?: QcInspectionSummary | null
  /** Resolved prices per level, null where none set (ADR 0034). Declared inline so device stays independent of pricing. */
  prices?: { RETAIL: string | null; WHOLESALE: string | null; PARTNER: string | null }
}

export interface DeviceModelRef {
  id: string
  brand: string
  name: string
  kindCode?: string
}

export interface QcInspectionSummary {
  id: string
  passed: boolean
  gradeCode: string | null
  batteryHealth: number | null
  inspectedAt: string
}

export interface DeviceDetailView extends DeviceView {
  model: DeviceModelRef
  status: { code: string; label: string }
  latestInspection: QcInspectionSummary | null
}

export interface DeviceStatusHistoryView {
  id: string
  fromStatusCode: string | null
  toStatusCode: string
  changedById: string
  reason: string | null
  changedAt: string
}

export interface PaginatedDevices {
  items: DeviceView[]
  total: number
  page: number
  pageSize: number
}

export interface DeviceFilters {
  imei?: string
  shipmentId?: string
  modelId?: string
  storage?: string
  statusCode?: string
  /** Comma-separated list, ignored when statusCode is set. */
  statusCodes?: string
  search?: string
  inspected?: "true" | "false"
  page?: number
  pageSize?: number
}

export interface UpdateDeviceDto {
  specs?: DeviceSpecs
  targetPrice?: number | null
  /** Optional dual-SIM second IMEI; null clears it. */
  imei2?: string | null
}

export interface ChangeStatusDto {
  toStatusCode: string
  reason?: string
  expectedVersion: number
}

/** `PATCH /devices/:id/expense` (`device.expense`). Note null clears it. */
export interface EditExpenseDto {
  unitExpense: number
  unitExpenseNote?: string | null
}

/** `PATCH /devices/:id/customs-fee` (`customs.manage`). */
export interface EditCustomsFeeDto {
  customsFee: number
}
