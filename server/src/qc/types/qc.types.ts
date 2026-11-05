export interface QcDefectView {
  defectCode: string;
  notes: string | null;
}

/** repairCostEstimate is a decimal string (cost-redacted). */
export interface QcInspectionView {
  id: string;
  deviceId: string;
  inspectedById: string;
  passed: boolean;
  gradeCode: string | null;
  batteryHealth: number | null;
  repairCostEstimate: string | null;
  notes: string | null;
  inspectedAt: Date;
  defects: QcDefectView[];
}

export interface InspectionDeviceRef {
  id: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  modelId: string;
  model: { brand: string; name: string; kindCode: string };
  statusCode: string;
}

/** List-row inspection: adds device + inspector context to the base view. */
export interface QcInspectionListItem extends QcInspectionView {
  device: InspectionDeviceRef;
  inspectedBy: { id: string; name: string };
}

export interface PaginatedInspections {
  items: QcInspectionListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LookupView {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateLookupInput {
  code: string;
  label: string;
  sortOrder?: number;
}

export interface UpdateLookupInput {
  label?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface InspectionFilters {
  storeIds?: string[];
  deviceId?: string;
  imei?: string;
  passed?: boolean;
  gradeCode?: string;
  defectCode?: string;
  inspectedById?: string;
  from?: Date;
  to?: Date;
}

export interface CreateInspectionInput {
  deviceId: string;
  inspectedById: string;
  passed: boolean;
  gradeCode?: string;
  batteryHealth?: number;
  repairCostEstimate?: number;
  notes?: string;
  defects: { defectCode: string; notes?: string }[];
}

export interface QcStatsView {
  inspected: number;
  passed: number;
  failed: number;
  passRate: number;
  byGrade: { gradeCode: string; count: number }[];
  topDefects: { defectCode: string; label: string; count: number }[];
  avgBatteryHealth: number | null;
  awaitingInspection: number;
}
