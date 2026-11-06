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
      },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    });
  }

  /** Counted products with pieces left in at least one of the stores. */
  private async quantityModelIdsInStock(storeIds: string[]): Promise<string[]> {
    const rows = await this.prisma.stockMovement.groupBy({
      by: ['modelId', 'storeId'],
      where: { storeId: { in: storeIds } },
      _sum: { quantity: true },
      having: { quantity: { _sum: { gt: 0 } } },
    });
    return [...new Set(rows.map((r) => r.modelId))];
  }
}
