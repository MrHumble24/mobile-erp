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
    await tx.device.update({
      where: { id: u.deviceId },
      data: { statusCode: 'IN_TRANSIT' },
    });
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

export async function executeReceiveTransfer(
  tx: Prisma.TransactionClient,
  transfer: StockTransferView,
  callerId: string,
): Promise<void> {
  for (const line of transfer.lines) {
    if (line.lineType === 'UNIT' && line.deviceId) {
      const restoreStatus = line.previousStatusCode ?? 'IN_STOCK';
      await tx.device.update({
        where: { id: line.deviceId },
        data: {
          storeId: transfer.targetStoreId,
          statusCode: restoreStatus,
        },
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
      await tx.stockMovement.create({
        data: {
          storeId: transfer.targetStoreId,
          modelId: line.modelId,
          typeCode: 'TRANSFER_IN',
          quantity: line.quantity,
          unitCostSnapshot: cost,
          transferId: transfer.id,
          createdById: callerId,
          note: line.note ?? `Transfer from ${transfer.sourceStore.name}`,
        },
      });
    }
  }

  await tx.stockTransfer.update({
    where: { id: transfer.id },
    data: {
      status: 'RECEIVED',
      receivedAt: new Date(),
      receivedById: callerId,
    },
  });
}

export async function executeCancelTransfer(
  tx: Prisma.TransactionClient,
  transfer: StockTransferView,
  callerId: string,
): Promise<void> {
  for (const line of transfer.lines) {
    if (line.lineType === 'UNIT' && line.deviceId) {
      const restoreStatus = line.previousStatusCode ?? 'IN_STOCK';
      await tx.device.update({
        where: { id: line.deviceId },
        data: { statusCode: restoreStatus },
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
      await tx.stockMovement.create({
        data: {
          storeId: transfer.sourceStoreId,
          modelId: line.modelId,
          typeCode: 'TRANSFER_IN',
          quantity: line.quantity,
          unitCostSnapshot: cost,
          transferId: transfer.id,
          createdById: callerId,
          note: 'Transfer cancelled',
        },
      });
    }
  }

  await tx.stockTransfer.update({
    where: { id: transfer.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledById: callerId,
    },
  });
}
