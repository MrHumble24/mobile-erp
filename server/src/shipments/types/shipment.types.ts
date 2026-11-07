/**
 * Shipment projection. `unitExpenseTotal` is the computed sum of its devices'
 * `unitExpense` (never stored; cost-redacted).
 */
export interface ShipmentView {
  id: string;
  supplierId: string;
  shipmentDate: Date;
  expectedCount: number;
  paymentAccountCode: string;
  exchangeRate?: string | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deviceCount: number;
  unitExpenseTotal: string;
  customsFeeTotal: string;
  /** Σ of this shipment's quantity PURCHASE lines (cost-redacted). */
  stockLinesTotal: string;
  /** Count of this shipment's devices whose customs fee is still 0 (warn UI). */
  devicesWithoutCustomsFee: number;
}

/** One quantity PURCHASE line of a shipment (unitCost/lineTotal cost-redacted). */
export interface ShipmentStockLineView {
  id: string;
  modelId: string;
  brand: string;
  name: string;
  quantity: number;
  unitCost: string | null;
  lineTotal: string | null;
  occurredAt: Date;
}

/** GET /shipments/:id — a shipment plus its quantity purchase lines. */
export interface ShipmentDetailView extends ShipmentView {
  stockLines: ShipmentStockLineView[];
}

/** Computed per-shipment totals (never stored). */
export interface ShipmentTotals {
  unitExpenseTotal: string;
  customsFeeTotal: string;
  devicesWithoutCustomsFee: number;
}

export interface ShipmentInput {
  storeId: string;
  supplierId: string;
  shipmentDate: Date;
  expectedCount: number;
  paymentAccountCode: string;
  exchangeRate?: number;
  notes?: string;
  createdById: string;
}

export interface ShipmentPatch {
  shipmentDate?: Date;
  expectedCount?: number;
  notes?: string;
}

export interface RegisterDeviceInput {
  /** One of `imei`/`serialNumber` is set, per the model's kind (ADR 0029). */
  imei?: string;
  imei2?: string;
  serialNumber?: string;
  modelId: string;
  /** Resolved from the model; drives per-kind intake validation. */
  kindCode: string;
  specs: Record<string, unknown>;
  acquisitionCost: number;
  acquisitionCostOriginal?: number;
  targetPrice?: number;
  /** Per-phone expense at intake; requires `device.expense` when non-zero. */
  unitExpense?: number;
  unitExpenseNote?: string;
  /** Stamped by the service from the current customs list (never client input). */
  customsFee?: number;
}

/** Confirmation of a registered unit with its computed landed cost. */
export interface RegisteredDeviceView {
  id: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  modelId: string;
  kindCode: string;
  acquisitionCost: string;
  acquisitionCostOriginal?: string | null;
  customsFee: string;
  unitExpense: string;
  landedCost: string;
  targetPrice: string | null;
  statusCode: string;
}

export interface ImportShipmentWarning {
  row: number;
  code: string;
  detail: string;
}

export interface ImportShipmentProblem {
  row: number;
  code: string;
  detail: string;
}

export interface ImportShipmentResultView extends ShipmentView {
  devices: RegisteredDeviceView[];
  warnings: ImportShipmentWarning[];
}
