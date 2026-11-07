import { Prisma } from '../../generated/client/client.js';
import type {
  RegisterDeviceInput,
  RegisteredDeviceView,
} from '../types/shipment.types.js';

export function deviceData(
  input: RegisterDeviceInput,
  storeId: string,
  shipmentId: string,
  landedCost: string,
  userId: string,
): Prisma.DeviceUncheckedCreateInput {
  return {
    imei: input.imei ?? null,
    imei2: input.imei2 ?? null,
    serialNumber: input.serialNumber ?? null,
    storeId,
    shipmentId,
    modelId: input.modelId,
    specs: input.specs as Prisma.InputJsonValue,
    acquisitionCost: input.acquisitionCost,
    acquisitionCostOriginal: input.acquisitionCostOriginal ?? null,
    customsFee: input.customsFee ?? 0,
    unitExpense: input.unitExpense ?? 0,
    unitExpenseNote: input.unitExpenseNote ?? null,
    landedCost,
    targetPrice: input.targetPrice ?? null,
    statusCode: 'IN_STOCK',
    statusHistory: {
      create: { toStatusCode: 'IN_STOCK', changedById: userId },
    },
  };
}

export function toRegisteredView(
  device: { id: string; statusCode: string },
  input: RegisterDeviceInput,
  customsFee: number,
  unitExpense: number,
  landedCost: string,
): RegisteredDeviceView {
  return {
    id: device.id,
    imei: input.imei ?? null,
    imei2: input.imei2 ?? null,
    serialNumber: input.serialNumber ?? null,
    modelId: input.modelId,
    kindCode: input.kindCode,
    acquisitionCost: new Prisma.Decimal(input.acquisitionCost).toFixed(2),
    acquisitionCostOriginal:
      input.acquisitionCostOriginal != null
        ? new Prisma.Decimal(input.acquisitionCostOriginal).toFixed(2)
        : null,
    customsFee: new Prisma.Decimal(customsFee).toFixed(2),
    unitExpense: new Prisma.Decimal(unitExpense).toFixed(2),
    landedCost,
    targetPrice:
      input.targetPrice != null
        ? new Prisma.Decimal(input.targetPrice).toFixed(2)
        : null,
    statusCode: device.statusCode,
  };
}
