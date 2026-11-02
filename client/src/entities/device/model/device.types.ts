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
  imei: string
  shipmentId: string
  modelId: string
  specs: DeviceSpecs
  acquisitionCost?: string
  landedCost?: string
  targetPrice: string | null
  statusCode: DeviceStatus | string
  intakeDate: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface DeviceModelRef {
  id: string
  brand: string
  name: string
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
  modelId?: string
  storage?: string
  statusCode?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface UpdateDeviceDto {
  specs?: DeviceSpecs
  targetPrice?: number | null
}

export interface ChangeStatusDto {
  toStatusCode: string
  reason?: string
  expectedVersion: number
}
