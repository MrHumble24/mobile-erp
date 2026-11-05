import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListStockTransfersQueryDto } from './dto/list-stock-transfers-query.dto.js';
import type {
  StockTransferLineView,
  StockTransferView,
} from './types/stock-transfer.types.js';

const TRANSFER_INCLUDE = {
  sourceStore: { select: { id: true, name: true } },
  targetStore: { select: { id: true, name: true } },
  sentBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  receivedBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  cancelledBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  lines: {
    include: {
      device: {
        select: {
          id: true,
          imei: true,
          imei2: true,
          serialNumber: true,
          specs: true,
          model: { select: { id: true, brand: true, name: true } },
        },
      },
      model: { select: { id: true, brand: true, name: true } },
    },
  },
} satisfies Prisma.StockTransferInclude;

type TransferRow = Prisma.StockTransferGetPayload<{
  include: typeof TRANSFER_INCLUDE;
}>;

@Injectable()
export class StockTransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    storeIds: string[],
    query: ListStockTransfersQueryDto,
  ): Promise<{ items: StockTransferView[]; total: number }> {
    const where: Prisma.StockTransferWhereInput = {
      OR: [
        { sourceStoreId: { in: storeIds } },
        { targetStoreId: { in: storeIds } },
      ],
      status: query.status,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockTransfer.findMany({
        where,
        include: TRANSFER_INCLUDE,
        orderBy: { sentAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return { items: rows.map(toView), total };
  }

  async findById(id: string): Promise<StockTransferView | null> {
    const row = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: TRANSFER_INCLUDE,
    });
    return row ? toView(row) : null;
  }
}

function userName(
  user: {
    id: string;
    profile: { firstName: string; lastName: string | null } | null;
  } | null,
): { id: string; name: string } {
  if (!user) return { id: '', name: '' };
  const p = user.profile;
  const name = p
    ? [p.firstName, p.lastName].filter(Boolean).join(' ')
    : user.id;
  return { id: user.id, name };
}

function toView(row: TransferRow): StockTransferView {
  return {
    id: row.id,
    sourceStoreId: row.sourceStoreId,
    sourceStore: row.sourceStore,
    targetStoreId: row.targetStoreId,
    targetStore: row.targetStore,
    status: row.status,
    sentAt: row.sentAt,
    sentBy: userName(row.sentBy),
    receivedAt: row.receivedAt,
    receivedBy: row.receivedBy ? userName(row.receivedBy) : null,
    cancelledAt: row.cancelledAt,
    cancelledBy: row.cancelledBy ? userName(row.cancelledBy) : null,
    note: row.note,
    lines: row.lines.map(toLineView),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLineView(line: TransferRow['lines'][number]): StockTransferLineView {
  return {
    id: line.id,
    lineType: line.lineType,
    deviceId: line.deviceId,
    device: line.device,
    previousStatusCode: line.previousStatusCode,
    modelId: line.modelId,
    model: line.model,
    quantity: line.quantity,
    unitCostSnapshot:
      line.unitCostSnapshot === null ? null : line.unitCostSnapshot.toFixed(2),
    note: line.note,
  };
}
