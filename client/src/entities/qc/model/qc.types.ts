export interface QcDefectView {
  defectCode: string
  notes: string | null
}

export interface QcInspectionView {
  id: string
  deviceId: string
  inspectedById: string
  passed: boolean
  gradeCode: string | null
  batteryHealth: number | null
  repairCostEstimate: string | null
  notes: string | null
  inspectedAt: string
  defects: QcDefectView[]
}

export interface InspectionDeviceRef {
  id: string
  imei: string | null
  imei2?: string | null
  serialNumber?: string | null
  modelId: string
  model: { brand: string; name: string; kindCode?: string }
  statusCode: string
}

export interface QcInspectionListItem extends QcInspectionView {
  device: InspectionDeviceRef
  inspectedBy: { id: string; name: string }
}

export interface PaginatedInspections {
  items: QcInspectionListItem[]
  total: number
  page: number
  pageSize: number
}

export interface InspectionFilters {
  deviceId?: string
  imei?: string
  passed?: "true" | "false"
  gradeCode?: string
  defectCode?: string
  inspectedById?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface LookupView {
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface CreateLookupDto {
  code: string
  label: string
  sortOrder?: number
}

export interface UpdateLookupDto {
  label?: string
  sortOrder?: number
  isActive?: boolean
}

export interface CreateInspectionDto {
  deviceId: string
  passed: boolean
  gradeCode?: string
  batteryHealth?: number
  repairCostEstimate?: number
  notes?: string
  defects: { defectCode: string; notes?: string }[]
}

export interface StatsRange {
  from?: string
  to?: string
}

export interface QcStatsView {
  inspected: number
  passed: number
  failed: number
  passRate: number
  byGrade: { gradeCode: string; count: number }[]
  topDefects: { defectCode: string; label: string; count: number }[]
  avgBatteryHealth: number | null
  awaitingInspection: number
}
