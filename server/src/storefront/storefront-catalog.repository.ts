import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PublicModelRow } from './storefront.repository.js';

export interface CatalogFilter {
  allowedCategoryIds?: string[];
  categoryId?: string;
  search?: string;
  page: number;
  pageSize: number;
}

/** The public product list. Paging counts only products a visitor can see. */
@Injectable()
export class StorefrontCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One page of active products that are in stock in `storeIds`. The stock
   * filter runs before skip/take, so every page but the last is full.
   */
  async findInStockModels(
    storeIds: string[],
    filter: CatalogFilter,
  ): Promise<PublicModelRow[]> {
    const and: Prisma.DeviceModelWhereInput[] = [
      {
        OR: [
          {
            devices: {
              some: { statusCode: 'IN_STOCK', storeId: { in: storeIds } },
            },
          },
          { id: { in: await this.quantityModelIdsInStock(storeIds) } },
        ],
      },
    ];
    if (filter.allowedCategoryIds?.length) {
      and.push({ categoryId: { in: filter.allowedCategoryIds } });
    }
    if (filter.categoryId) and.push({ categoryId: filter.categoryId });
    const term = filter.search?.trim();
    if (term) {
      and.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { modelCode: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.deviceModel.findMany({
      where: { isActive: true, AND: and },
      select: {
        id: true,
        brand: true,
        name: true,
        kindCode: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        imageFileName: true,
        salePrice: true,
        colorImages: { select: { color: true, imageFileName: true }, take: 1 },
      },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    });
  }

  /** Counted products with pieces left in at least one of the stores (subtracting open orders). */
  private async quantityModelIdsInStock(storeIds: string[]): Promise<string[]> {
    const movements = await this.prisma.stockMovement.groupBy({
      by: ['modelId', 'storeId'],
      where: { storeId: { in: storeIds } },
      _sum: { quantity: true },
      having: { quantity: { _sum: { gt: 0 } } },
    });
    if (movements.length === 0) return [];

    const modelIds = [...new Set(movements.map((r) => r.modelId))];
    const openOrders = await this.prisma.storefrontOrder.groupBy({
      by: ['modelId', 'storeId'],
      where: {
        modelId: { in: modelIds },
        storeId: { in: storeIds },
        statusCode: { in: ['NEW', 'CONTACTED', 'SHIPPED'] },
      },
      _count: { id: true },
    });

    const openOrderMap = new Map<string, number>();
    for (const o of openOrders) {
      openOrderMap.set(`${o.modelId}:${o.storeId}`, o._count.id);
    }

    const availableModelIds = new Set<string>();
    for (const m of movements) {
      const sum = m._sum.quantity ?? 0;
      const open = openOrderMap.get(`${m.modelId}:${m.storeId}`) ?? 0;
      if (sum - open > 0) {
        availableModelIds.add(m.modelId);
      }
    }

    return [...availableModelIds];
  }
}
