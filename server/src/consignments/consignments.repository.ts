import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toConsignmentView, withImei } from './lib/consignment.mapper.js';
import {
  ConsignmentFilters,
  ConsignmentPage,
  ConsignmentView,
  OverdueConsignment,
} from './types/consignment.types.js';

/** Read-side Prisma access for consignments. Writes live in the write repo. */
@Injectable()
export class ConsignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByClientMutationId(id: string): Promise<ConsignmentView | null> {
    const row = await this.prisma.consignment.findUnique({
      where: { clientMutationId: id },
      include: withImei,
    });
    return row ? toConsignmentView(row) : null;
  }

  async findById(id: string): Promise<ConsignmentView | null> {
    const row = await this.prisma.consignment.findUnique({
      where: { id },
      include: withImei,
    });
    return row ? toConsignmentView(row) : null;
  }

  async list(
    filters: ConsignmentFilters,
    page: number,
    pageSize: number,
  ): Promise<ConsignmentPage> {
    const where = buildWhere(filters);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.consignment.findMany({
        where,
        include: withImei,
        orderBy: { consignedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.consignment.count({ where }),
    ]);
    return { items: rows.map(toConsignmentView), total, page, pageSize };
  }

  async findOverdue(): Promise<OverdueConsignment[]> {
    const rows = await this.prisma.consignment.findMany({
      where: { statusCode: 'OUT', dueDate: { lt: new Date() } },
      orderBy: { dueDate: 'asc' },
      include: {
        device: { select: { imei: true } },
        partner: {
          select: { shopName: true, phone: true, telegramHandle: true },
        },
      },
    });
    return rows.map((r) => ({
      ...toConsignmentView(r),
      partnerShopName: r.partner.shopName,
      partnerPhone: r.partner.phone,
      partnerTelegramHandle: r.partner.telegramHandle,
    }));
  }
}

function buildWhere(f: ConsignmentFilters): Prisma.ConsignmentWhereInput {
  const where: Prisma.ConsignmentWhereInput = {};
  if (f.partnerId) where.partnerId = f.partnerId;
  if (f.overdue) {
    where.statusCode = 'OUT';
    where.dueDate = { lt: new Date() };
  } else if (f.statusCode) {
    where.statusCode = f.statusCode;
  }
  return where;
}
