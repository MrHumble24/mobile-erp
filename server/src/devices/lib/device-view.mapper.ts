import { DeviceView } from '../types/device.types.js';

/** Structural shape of a scalar device row — avoids importing generated types. */
export interface DeviceScalarRow {
  id: string;
  imei: string;
  imei2: string | null;
  shipmentId: string;
  modelId: string;
  specs: unknown;
  acquisitionCost: { toString(): string };
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
    shipmentId: row.shipmentId,
    modelId: row.modelId,
    specs: (row.specs ?? {}) as Record<string, unknown>,
    acquisitionCost: row.acquisitionCost.toString(),
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
