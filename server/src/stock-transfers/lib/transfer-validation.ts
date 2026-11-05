import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StockRepository } from '../../stock/stock.repository.js';
import { CreateTransferLineDto } from '../dto/create-stock-transfer.dto.js';
import type {
  PreparedQuantityLine,
  PreparedUnitLine,
} from './transfer-execution.js';

export async function validateTransferLines(
  prisma: PrismaService,
  stockRepo: StockRepository,
  sourceStoreId: string,
  lines: CreateTransferLineDto[],
): Promise<{
  unitLines: PreparedUnitLine[];
  quantityLines: PreparedQuantityLine[];
}> {
  const unitLines: PreparedUnitLine[] = [];
  const quantityLines: PreparedQuantityLine[] = [];

  for (const line of lines) {
    if (line.lineType === 'UNIT') {
      const u = await validateUnitLine(prisma, sourceStoreId, line);
      unitLines.push(u);
    } else {
      const q = await validateQuantityLine(stockRepo, sourceStoreId, line);
      quantityLines.push(q);
    }
  }

  return { unitLines, quantityLines };
}

async function validateUnitLine(
  prisma: PrismaService,
  sourceStoreId: string,
  line: CreateTransferLineDto,
): Promise<PreparedUnitLine> {
  if (!line.deviceId) {
    throw new BadRequestException('deviceId is required for UNIT line');
  }
  const device = await prisma.device.findUnique({
    where: { id: line.deviceId },
    select: { id: true, storeId: true, statusCode: true },
  });
  if (!device || device.storeId !== sourceStoreId) {
    throw new BadRequestException(
      `Device ${line.deviceId} not found in source store`,
    );
  }
  if (device.statusCode !== 'IN_STOCK') {
    throw new BadRequestException({
      code: 'DEVICE_NOT_TRANSFERABLE',
      message: `Device ${line.deviceId} is ${device.statusCode}, not IN_STOCK`,
    });
  }
  return {
    deviceId: device.id,
    previousStatusCode: device.statusCode,
    note: line.note,
  };
}

async function validateQuantityLine(
  stockRepo: StockRepository,
  sourceStoreId: string,
  line: CreateTransferLineDto,
): Promise<PreparedQuantityLine> {
  if (!line.modelId || !line.quantity || line.quantity < 1) {
    throw new BadRequestException(
      'modelId and positive quantity are required for QUANTITY line',
    );
  }
  const kind = await stockRepo.modelKind(line.modelId);
  if (kind !== 'QUANTITY') {
    throw new BadRequestException(
      `Model ${line.modelId} is not a QUANTITY product`,
    );
  }
  const agg = await stockRepo.aggregate(sourceStoreId, line.modelId);
  if (agg.quantity < line.quantity) {
    throw new BadRequestException({
      code: 'INSUFFICIENT_STOCK',
      message: `Insufficient stock for model ${line.modelId}: available ${agg.quantity}, requested ${line.quantity}`,
    });
  }
  const unitCost =
    agg.quantity > 0
      ? agg.value.dividedBy(agg.quantity).toDecimalPlaces(2)
      : agg.latestPurchaseCost;
  return {
    modelId: line.modelId,
    quantity: line.quantity,
    unitCostSnapshot: unitCost,
    note: line.note,
  };
}
