/** Shipment projection. overheadCost is a decimal string (cost-redacted). */
export interface ShipmentView {
  id: string;
  supplierId: string;
  shipmentDate: Date;
  expectedCount: number;
  overheadCost: string;
  paymentAccountCode: string;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deviceCount: number;
}

export interface ShipmentInput {
  storeId: string;
  supplierId: string;
  shipmentDate: Date;
  expectedCount: number;
  overheadCost?: number;
  paymentAccountCode: string;
  notes?: string;
  createdById: string;
}

export interface ShipmentPatch {
  shipmentDate?: Date;
  expectedCount?: number;
  overheadCost?: number;
  notes?: string;
}

export interface RegisterDeviceInput {
  imei: string;
  imei2?: string;
  modelId: string;
  specs: Record<string, unknown>;
  acquisitionCost: number;
  targetPrice?: number;
}

/** Confirmation of a registered unit with its allocated landed cost. */
export interface RegisteredDeviceView {
  id: string;
  imei: string;
  imei2: string | null;
  modelId: string;
  acquisitionCost: string;
  landedCost: string;
  targetPrice: string | null;
  statusCode: string;
}
