import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toConsignmentView, withImei } from './lib/consignment.mapper.js';
import { buildConsignmentWhere } from './lib/consignment.where.js';
import {
  ConsignmentFilters,
  ConsignmentPage,
  ConsignmentStats,
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

  async findById(
    id: string,
    storeIds?: string[],
  ): Promise<ConsignmentView | null> {
    const where: Prisma.ConsignmentWhereInput = {
      id,
      ...(storeIds?.length ? { storeId: { in: storeIds } } : {}),
    };
    const row = await this.prisma.consignment.findFirst({
      where,
      include: withImei,
    });
    return row ? toConsignmentView(row) : null;
  }

  async list(
    filters: ConsignmentFilters,
    page: number,
    pageSize: number,
    storeIds?: string[],
  ): Promise<ConsignmentPage> {
    const where = buildConsignmentWhere(filters, new Date(), storeIds);
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

  /**
   * Tiles for the filtered set. Status/overdue are dropped from the base so the
   * breakdown (open, overdue, outstanding) is shown regardless of the tab.
   */
  async stats(
    filters: ConsignmentFilters,
    storeIds?: string[],
  ): Promise<ConsignmentStats> {
    const base = buildConsignmentWhere(
      {
        partnerId: filters.partnerId,
        search: filters.search,
        from: filters.from,
        to: filters.to,
      },
      new Date(),
      storeIds,
    );
    const out: Prisma.ConsignmentWhereInput = { ...base, statusCode: 'OUT' };
    const [total, openCount, overdueCount, agg] =
      await this.prisma.$transaction([
        this.prisma.consignment.count({ where: base }),
        this.prisma.consignment.count({ where: out }),
        this.prisma.consignment.count({
          where: { ...out, dueDate: { lt: new Date() } },
        }),
        this.prisma.consignment.aggregate({
          where: out,
          _sum: { agreedPrice: true },
        }),
      ]);
    return {
      total,
      openCount,
      overdueCount,
      outstanding: agg._sum.agreedPrice ?? new Prisma.Decimal(0),
    };
  }

  async findOverdue(): Promise<OverdueConsignment[]> {
    const rows = await this.prisma.consignment.findMany({
      where: { statusCode: 'OUT', dueDate: { lt: new Date() } },
      orderBy: { dueDate: 'asc' },
      include: {
        device: {
          select: {
            imei: true,
            imei2: true,
            serialNumber: true,
            model: { select: { kindCode: true } },
          },
        },
        sale: { select: { id: true } },
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
