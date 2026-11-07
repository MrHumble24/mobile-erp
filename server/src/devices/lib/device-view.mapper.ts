import { DeviceView } from '../types/device.types.js';

/** Structural shape of a scalar device row — avoids importing generated types. */
export interface DeviceScalarRow {
  id: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  shipmentId: string | null;
  modelId: string;
  specs: unknown;
  acquisitionCost: { toString(): string };
  acquisitionCostOriginal?: { toString(): string } | null;
  exchangeRate?: { toString(): string } | null;
  customsFee: { toString(): string };
  unitExpense: { toString(): string };
  unitExpenseNote: string | null;
  landedCost: { toString(): string };
  targetPrice: { toString(): string } | null;
  statusCode: string;
  intakeDate: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Maps a Prisma device row to the client-facing view (Decimal → string). */
export function toDeviceView(row: DeviceScalarRow): DeviceView {
  return {
    id: row.id,
    imei: row.imei,
    imei2: row.imei2,
    serialNumber: row.serialNumber,
    shipmentId: row.shipmentId,
    modelId: row.modelId,
    specs: (row.specs ?? {}) as Record<string, unknown>,
    acquisitionCost: row.acquisitionCost.toString(),
    acquisitionCostOriginal: row.acquisitionCostOriginal
      ? row.acquisitionCostOriginal.toString()
      : null,
    exchangeRate: row.exchangeRate ? row.exchangeRate.toString() : null,
    customsFee: row.customsFee.toString(),
    unitExpense: row.unitExpense.toString(),
    unitExpenseNote: row.unitExpenseNote,
    landedCost: row.landedCost.toString(),
    targetPrice: row.targetPrice ? row.targetPrice.toString() : null,
    statusCode: row.statusCode,
    intakeDate: row.intakeDate,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
