import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import type { StockTransferView } from '../types/stock-transfer.types.js';

export interface PreparedUnitLine {
  deviceId: string;
  previousStatusCode: string;
  note?: string;
}

export interface PreparedQuantityLine {
  modelId: string;
  quantity: number;
  unitCostSnapshot: Prisma.Decimal;
  note?: string;
}

export async function executeCreateTransfer(
  tx: Prisma.TransactionClient,
  opts: {
    sourceStoreId: string;
    targetStoreId: string;
    targetStoreName: string;
    callerId: string;
    note?: string;
    unitLines: PreparedUnitLine[];
    quantityLines: PreparedQuantityLine[];
  },
): Promise<string> {
  const transfer = await tx.stockTransfer.create({
    data: {
      sourceStoreId: opts.sourceStoreId,
      targetStoreId: opts.targetStoreId,
      status: 'SENT',
      sentById: opts.callerId,
      note: opts.note,
    },
    select: { id: true },
  });

  await createTransferUnitLines(tx, transfer.id, opts.callerId, opts.unitLines);
  await createTransferQuantityLines(
    tx,
    transfer.id,
    opts.callerId,
    opts.sourceStoreId,
    opts.targetStoreName,
    opts.quantityLines,
  );

  return transfer.id;
}

async function createTransferUnitLines(
  tx: Prisma.TransactionClient,
  transferId: string,
  callerId: string,
  unitLines: PreparedUnitLine[],
): Promise<void> {
  for (const u of unitLines) {
    await tx.stockTransferLine.create({
      data: {
        transferId,
        lineType: 'UNIT',
        deviceId: u.deviceId,
        previousStatusCode: u.previousStatusCode,
        note: u.note,
      },
    });
    const updated = await tx.device.updateMany({
      where: { id: u.deviceId, statusCode: 'IN_STOCK' },
      data: { statusCode: 'IN_TRANSIT' },
    });
    if (updated.count === 0) {
      throw new ConflictException({
        code: 'DEVICE_NOT_IN_STOCK',
        message: `Device ${u.deviceId} is not IN_STOCK`,
      });
    }
    await tx.deviceStatusHistory.create({
      data: {
        deviceId: u.deviceId,
        fromStatusCode: u.previousStatusCode,
        toStatusCode: 'IN_TRANSIT',
        changedById: callerId,
      },
    });
  }
}

async function createTransferQuantityLines(
  tx: Prisma.TransactionClient,
  transferId: string,
  callerId: string,
  sourceStoreId: string,
  targetStoreName: string,
  quantityLines: PreparedQuantityLine[],
): Promise<void> {
  for (const q of quantityLines) {
    await tx.stockTransferLine.create({
      data: {
        transferId,
        lineType: 'QUANTITY',
        modelId: q.modelId,
        quantity: q.quantity,
        unitCostSnapshot: q.unitCostSnapshot,
        note: q.note,
      },
    });
    await tx.stockMovement.create({
      data: {
        storeId: sourceStoreId,
        modelId: q.modelId,
        typeCode: 'TRANSFER_OUT',
        quantity: -q.quantity,
        unitCostSnapshot: q.unitCostSnapshot,
        transferId,
        createdById: callerId,
        note: q.note ?? `Transfer to ${targetStoreName}`,
      },
    });
  }
}

async function applyTransferLine(
  tx: Prisma.TransactionClient,
  transfer: StockTransferView,
  line: StockTransferView['lines'][number],
  callerId: string,
  isReceive: boolean,
): Promise<void> {
  if (line.lineType === 'UNIT' && line.deviceId) {
    const restoreStatus = line.previousStatusCode ?? 'IN_STOCK';
    const storeData = isReceive ? { storeId: transfer.targetStoreId } : {};
    await tx.device.update({
      where: { id: line.deviceId },
      data: { ...storeData, statusCode: restoreStatus },
    });
    await tx.deviceStatusHistory.create({
      data: {
        deviceId: line.deviceId,
        fromStatusCode: 'IN_TRANSIT',
        toStatusCode: restoreStatus,
        changedById: callerId,
      },
    });
  } else if (line.lineType === 'QUANTITY' && line.modelId && line.quantity) {
    const cost = line.unitCostSnapshot
      ? new Prisma.Decimal(line.unitCostSnapshot)
      : new Prisma.Decimal(0);
    const storeId = isReceive ? transfer.targetStoreId : transfer.sourceStoreId;
    const note = isReceive
      ? (line.note ?? `Transfer from ${transfer.sourceStore.name}`)
      : 'Transfer cancelled';
    await tx.stockMovement.create({
      data: {
        storeId,
        modelId: line.modelId,
        typeCode: 'TRANSFER_IN',
        quantity: line.quantity,
        unitCostSnapshot: cost,
        transferId: transfer.id,
        createdById: callerId,
        note,
      },
    });
  }
}

export async function executeReceiveTransfer(
  tx: Prisma.TransactionClient,
  transfer: StockTransferView,
  callerId: string,
): Promise<void> {
  const res = await tx.stockTransfer.updateMany({
    where: { id: transfer.id, status: 'SENT' },
    data: {
      status: 'RECEIVED',
      receivedAt: new Date(),
      receivedById: callerId,
    },
  });
  if (res.count === 0) {
    throw new ConflictException({
      code: 'TRANSFER_NOT_SENT',
      message: `Transfer ${transfer.id} is no longer in SENT status`,
    });
  }

  for (const line of transfer.lines) {
    await applyTransferLine(tx, transfer, line, callerId, true);
  }
}

export async function executeCancelTransfer(
  tx: Prisma.TransactionClient,
  transfer: StockTransferView,
  callerId: string,
): Promise<void> {
  const res = await tx.stockTransfer.updateMany({
    where: { id: transfer.id, status: 'SENT' },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledById: callerId,
    },
  });
  if (res.count === 0) {
    throw new ConflictException({
      code: 'TRANSFER_NOT_SENT',
      message: `Transfer ${transfer.id} is no longer in SENT status`,
    });
  }

  for (const line of transfer.lines) {
    await applyTransferLine(tx, transfer, line, callerId, false);
  }
}
