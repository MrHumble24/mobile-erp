/** One physical unit, money as decimal strings (redaction strips by key). */
export interface DeviceView {
  id: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  shipmentId: string | null;
  modelId: string;
  specs: Record<string, unknown>;
  acquisitionCost: string;
  acquisitionCostOriginal?: string | null;
  exchangeRate?: string | null;
  customsFee: string;
  unitExpense: string;
  unitExpenseNote: string | null;
  landedCost: string;
  targetPrice: string | null;
  statusCode: string;
  intakeDate: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceModelRef {
  id: string;
  brand: string;
  name: string;
  kindCode: string;
}

/** Minimal QC view for the POS lookup. */
export interface QcInspectionSummary {
  id: string;
  passed: boolean;
  gradeCode: string | null;
  batteryHealth: number | null;
  inspectedAt: Date;
}

/** Full device for the POS by-imei lookup. */
export interface DeviceDetailView extends DeviceView {
  model: DeviceModelRef;
  status: { code: string; label: string };
  latestInspection: QcInspectionSummary | null;
  /** Resolved list price per level so a till can switch level offline (ADR 0034). */
  prices: Record<string, string | null>;
}

export interface DeviceStatusHistoryView {
  id: string;
  fromStatusCode: string | null;
  toStatusCode: string;
  changedById: string;
  reason: string | null;
  changedAt: Date;
}

/** List row = scalar device plus its most recent QC summary (or null). */
export interface DeviceListView extends DeviceView {
  latestInspection: QcInspectionSummary | null;
}

export interface PaginatedDevices {
  items: DeviceListView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeviceFilters {
  imei?: string;
  modelId?: string;
  shipmentId?: string;
  storage?: string;
  statusCode?: string;
  statusCodes?: string;
  search?: string;
  inspected?: 'true' | 'false';
}

export interface DeviceDetailsPatch {
  specs?: Record<string, unknown>;
  targetPrice?: number | null;
  imei2?: string | null;
}

export interface StatusChangeInput {
  deviceId: string;
  fromStatusCode: string;
  toStatusCode: string;
  changedById: string;
  reason?: string;
  expectedVersion: number;
}
