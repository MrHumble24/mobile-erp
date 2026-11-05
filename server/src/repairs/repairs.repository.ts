import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListRepairsQueryDto } from './dto/list-repairs.query.dto.js';

const USER_SELECT = {
  select: {
    id: true,
    profile: { select: { firstName: true, lastName: true } },
  },
} satisfies Prisma.UserDefaultArgs;

/** The full ticket graph every read shapes a view from. */
export const REPAIR_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true } },
  model: { select: { brand: true, name: true } },
  status: { select: { code: true, label: true, isTerminal: true } },
  receivedBy: USER_SELECT,
  master: USER_SELECT,
  parts: {
    include: {
      addedBy: USER_SELECT,
      model: { select: { brand: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  payments: {
    include: { receivedBy: USER_SELECT },
    orderBy: { occurredAt: 'asc' },
  },
  statusHistory: {
    include: { changedBy: USER_SELECT },
    orderBy: { changedAt: 'asc' },
  },
} satisfies Prisma.RepairInclude;

export type RepairRaw = Prisma.RepairGetPayload<{
  include: typeof REPAIR_INCLUDE;
}>;

/** All Prisma reads for repairs. Writes live in RepairsWriteRepository. */
@Injectable()
export class RepairsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRawById(id: string): Promise<RepairRaw | null> {
    return this.prisma.repair.findUnique({
      where: { id },
      include: REPAIR_INCLUDE,
    });
  }

  findPartById(repairId: string, partId: string) {
    return this.prisma.repairPart.findFirst({
      where: { id: partId, repairId },
      select: {
        id: true,
        modelId: true,
        quantity: true,
        unitCostSnapshot: true,
      },
    });
  }

  async list(
    storeId: string,
    query: ListRepairsQueryDto,
  ): Promise<{ items: RepairRaw[]; total: number }> {
    const where = this.toWhere(storeId, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.repair.findMany({
        where,
        include: REPAIR_INCLUDE,
        orderBy: { receivedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.repair.count({ where }),
    ]);
    return { items, total };
  }

  /** Σ customer payments (net of refunds) in [from, to] for the store (report). */
  async sumPayments(
    storeId: string,
    from?: Date,
    to?: Date,
  ): Promise<Prisma.Decimal> {
    const { _sum } = await this.prisma.repairPayment.aggregate({
      where: { repair: { storeId }, occurredAt: range(from, to) },
      _sum: { amount: true },
    });
    return _sum.amount ?? new Prisma.Decimal(0);
  }

  /** Parts taken in [from, to] for the store, to sum cost in the service. */
  partsInRange(
    storeId: string,
    from?: Date,
    to?: Date,
  ): Promise<{ quantity: number; unitCostSnapshot: Prisma.Decimal }[]> {
    return this.prisma.repairPart.findMany({
      where: { repair: { storeId }, createdAt: range(from, to) },
      select: { quantity: true, unitCostSnapshot: true },
    });
  }

  private toWhere(
    storeId: string,
    query: ListRepairsQueryDto,
  ): Prisma.RepairWhereInput {
    const where: Prisma.RepairWhereInput = { storeId };
    if (query.status) where.statusCode = query.status;
    if (query.customerId) where.customerId = query.customerId;
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    if (from || to) where.receivedAt = range(from, to);
    const search = query.search?.trim();
    if (search) {
      const or: Prisma.RepairWhereInput[] = [
        { imei: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { customer: { phone: { contains: search } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
      const asNumber = Number(search);
      if (Number.isInteger(asNumber)) or.push({ ticketNumber: asNumber });
      where.OR = or;
    }
    return where;
  }
}

function range(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return { gte: from, lte: to };
}

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}
