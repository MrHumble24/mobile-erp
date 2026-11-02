import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReturnRow } from './types/reports.types.js';

/** Paginated sale-return list joined with its device and processor. */
@Injectable()
export class ReportsReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async page(
    from: Date | undefined,
    to: Date | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: ReturnRow[]; total: number }> {
    const where: Prisma.SaleReturnWhereInput =
      from || to ? { returnedAt: { gte: from, lte: to } } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.saleReturn.findMany({
        where,
        orderBy: { returnedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          saleId: true,
          refundAmount: true,
          reason: true,
          returnedAt: true,
          sale: {
            select: { device: { select: { imei: true, model: true } } },
          },
          processedBy: { select: { profile: true } },
        },
      }),
      this.prisma.saleReturn.count({ where }),
    ]);
    return { items: rows.map(toReturnRow), total };
  }
}

type RawReturn = {
  saleId: string;
  refundAmount: Prisma.Decimal;
  reason: string | null;
  returnedAt: Date;
  sale: { device: { imei: string; model: { brand: string; name: string } } };
  processedBy: {
    profile: { firstName: string; lastName: string | null } | null;
  };
};

function toReturnRow(r: RawReturn): ReturnRow {
  const p = r.processedBy.profile;
  return {
    id: r.saleId,
    saleId: r.saleId,
    imei: r.sale.device.imei,
    model: `${r.sale.device.model.brand} ${r.sale.device.model.name}`,
    refundAmount: Number(r.refundAmount),
    reason: r.reason,
    returnedAt: r.returnedAt.toISOString(),
    processedBy: p ? `${p.firstName} ${p.lastName ?? ''}`.trim() : r.saleId,
  };
}
