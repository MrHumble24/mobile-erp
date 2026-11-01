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

export interface LookupView {
  code: string;
  label: string;
  sortOrder: number;
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
