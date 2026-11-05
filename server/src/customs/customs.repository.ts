import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePriceListInput } from './types/customs.types.js';

const itemSelect = {
  customsCode: true,
  description: true,
  fee: true,
} satisfies Prisma.CustomsPriceListItemSelect;

export type PriceListWithItems = Prisma.CustomsPriceListGetPayload<{
  include: { items: { select: typeof itemSelect } };
}>;

/** All Prisma access for customs price lists. Versions are append-only. */
@Injectable()
export class CustomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePriceListInput) {
    return this.prisma.customsPriceList.create({
      data: {
        effectiveAt: input.effectiveAt,
        note: input.note,
        createdById: input.createdById,
        items: {
          create: input.items.map((i) => ({
            customsCode: i.customsCode,
            description: i.description,
            fee: i.fee,
          })),
        },
      },
      select: {
        id: true,
        effectiveAt: true,
        note: true,
        createdById: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
  }

  listVersions() {
    return this.prisma.customsPriceList.findMany({
      orderBy: { effectiveAt: 'desc' },
      select: {
        id: true,
        effectiveAt: true,
        note: true,
        createdById: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });
  }

  /** The two newest versions (current, previous) with their items. */
  twoNewest(): Promise<PriceListWithItems[]> {
    return this.prisma.customsPriceList.findMany({
      orderBy: { effectiveAt: 'desc' },
      take: 2,
      include: { items: { select: itemSelect } },
    });
  }

  /** Every (effectiveAt, fee) for one code across versions, oldest first. */
  feeHistory(customsCode: string) {
    return this.prisma.customsPriceListItem.findMany({
      where: { customsCode },
      orderBy: { list: { effectiveAt: 'asc' } },
      select: {
        listId: true,
        fee: true,
        list: { select: { effectiveAt: true } },
      },
    });
  }

  /** Distinct non-null customsCodes used by our device models. */
  async modelCustomsCodes(): Promise<Set<string>> {
    const rows = await this.prisma.deviceModel.findMany({
      where: { customsCode: { not: null } },
      select: { customsCode: true },
      distinct: ['customsCode'],
    });
    return new Set(rows.map((r) => r.customsCode as string));
  }

  activeModels() {
    return this.prisma.deviceModel.findMany({
      where: { isActive: true },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
      select: { id: true, brand: true, name: true, customsCode: true },
    });
  }
}
