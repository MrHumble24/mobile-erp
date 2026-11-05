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
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deviceCount: number;
  unitExpenseTotal: string;
  customsFeeTotal: string;
  /** Count of this shipment's devices whose customs fee is still 0 (warn UI). */
  devicesWithoutCustomsFee: number;
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
  notes?: string;
  createdById: string;
}

export interface ShipmentPatch {
  shipmentDate?: Date;
  expectedCount?: number;
  notes?: string;
}

export interface RegisterDeviceInput {
  imei: string;
  imei2?: string;
  modelId: string;
  specs: Record<string, unknown>;
  acquisitionCost: number;
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
  imei: string;
  imei2: string | null;
  modelId: string;
  acquisitionCost: string;
  customsFee: string;
  unitExpense: string;
  landedCost: string;
  targetPrice: string | null;
  statusCode: string;
}
