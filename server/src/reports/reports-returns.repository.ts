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
            select: {
              quantity: true,
              device: {
                select: { imei: true, serialNumber: true, model: true },
              },
              model: true,
            },
          },
          processedBy: { select: { profile: true } },
        },
      }),
      this.prisma.saleReturn.count({ where }),
    ]);
    return { items: rows.map(toReturnRow), total };
  }
}

type ModelRef = { brand: string; name: string };
type RawReturn = {
  saleId: string;
  refundAmount: Prisma.Decimal;
  reason: string | null;
  returnedAt: Date;
  sale: {
    quantity: number | null;
    device: {
      imei: string | null;
      serialNumber: string | null;
      model: ModelRef;
    } | null;
    model: ModelRef | null;
  };
  processedBy: {
    profile: { firstName: string; lastName: string | null } | null;
  };
};

function toReturnRow(r: RawReturn): ReturnRow {
  const p = r.processedBy.profile;
  // A quantity sale has no device: its identifier is the piece count, its model
  // is on the sale itself.
  const ref = r.sale.device?.model ?? r.sale.model;
  const label = ref ? `${ref.brand} ${ref.name}` : '';
  const imei =
    r.sale.device?.imei ??
    r.sale.device?.serialNumber ??
    (r.sale.quantity !== null ? `×${r.sale.quantity}` : '');
  return {
    id: r.saleId,
    saleId: r.saleId,
    imei,
    model: label,
    quantity: r.sale.quantity,
    refundAmount: Number(r.refundAmount),
    reason: r.reason,
    returnedAt: r.returnedAt.toISOString(),
    processedBy: p ? `${p.firstName} ${p.lastName ?? ''}`.trim() : r.saleId,
  };
}
