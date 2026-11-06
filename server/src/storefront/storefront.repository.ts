import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorefrontSettingsRepository } from './storefront-settings.repository.js';
import type {
  StorefrontCategoryView,
  StorefrontSettingsView,
  StorefrontStoreView,
} from './types/storefront.types.js';

export interface PublicUnitRow {
  id: string;
  modelId: string;
  storeId: string;
  specs: unknown;
  targetPrice: Prisma.Decimal | null;
}

export interface PublicModelRow {
  id: string;
  brand: string;
  name: string;
  kindCode: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  imageFileName: string | null;
  salePrice: Prisma.Decimal | null;
}

@Injectable()
export class StorefrontRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsRepo: StorefrontSettingsRepository,
  ) {}

  getSettings(): Promise<StorefrontSettingsView> {
    return this.settingsRepo.getSettings();
  }

  updateSettings(
    data: Partial<StorefrontSettingsView>,
  ): Promise<StorefrontSettingsView> {
    return this.settingsRepo.updateSettings(data);
  }

  activeStores(): Promise<StorefrontStoreView[]> {
    return this.prisma.store.findMany({
      where: { deactivatedAt: null },
      select: { id: true, name: true, address: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  activeCategories(allowedIds?: string[]): Promise<StorefrontCategoryView[]> {
    const where: Prisma.ProductCategoryWhereInput = { isActive: true };
    if (allowedIds && allowedIds.length > 0) {
      where.id = { in: allowedIds };
    }
    return this.prisma.productCategory.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  inStockUnitsForModels(
    modelIds: string[],
    storeIds: string[],
  ): Promise<PublicUnitRow[]> {
    if (modelIds.length === 0 || storeIds.length === 0)
      return Promise.resolve([]);
    return this.prisma.device.findMany({
      where: {
        modelId: { in: modelIds },
        storeId: { in: storeIds },
        statusCode: 'IN_STOCK',
      },
      select: {
        id: true,
        modelId: true,
        storeId: true,
        specs: true,
        targetPrice: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async quantityStockForModels(
    modelIds: string[],
    storeIds: string[],
  ): Promise<Map<string, Map<string, number>>> {
    const result = new Map<string, Map<string, number>>();
    if (modelIds.length === 0 || storeIds.length === 0) return result;

    const [grouped, openOrders] = await Promise.all([
      this.prisma.stockMovement.groupBy({
        by: ['modelId', 'storeId'],
        where: {
          modelId: { in: modelIds },
          storeId: { in: storeIds },
        },
        _sum: { quantity: true },
      }),
      this.prisma.storefrontOrder.groupBy({
        by: ['modelId', 'storeId'],
        where: {
          modelId: { in: modelIds },
          storeId: { in: storeIds },
          statusCode: { in: ['NEW', 'CONTACTED', 'SHIPPED'] },
        },
        _count: { id: true },
      }),
    ]);

    const openOrderMap = new Map<string, number>();
    for (const o of openOrders) {
      openOrderMap.set(`${o.modelId}:${o.storeId}`, o._count.id);
    }

    for (const row of grouped) {
      if (!result.has(row.modelId)) {
        result.set(row.modelId, new Map());
      }
      const sum = row._sum.quantity ?? 0;
      const open = openOrderMap.get(`${row.modelId}:${row.storeId}`) ?? 0;
      result.get(row.modelId)!.set(row.storeId, Math.max(0, sum - open));
    }
    return result;
  }

  findModelById(modelId: string): Promise<PublicModelRow | null> {
    return this.prisma.deviceModel.findFirst({
      where: { id: modelId, isActive: true },
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
    });
  }

  async countModelInStockForStore(
    modelId: string,
    storeId: string,
    kindCode: string,
    specs?: Record<string, unknown>,
  ): Promise<number> {
    if (kindCode === 'QUANTITY') {
      const [agg, openOrdersCount] = await Promise.all([
        this.prisma.stockMovement.aggregate({
          where: { modelId, storeId },
          _sum: { quantity: true },
        }),
        this.prisma.storefrontOrder.count({
          where: {
            modelId,
            storeId,
            statusCode: { in: ['NEW', 'CONTACTED', 'SHIPPED'] },
          },
        }),
      ]);
      const qty = agg._sum.quantity ?? 0;
      return Math.max(0, qty - openOrdersCount);
    }

    const conditions: Prisma.DeviceWhereInput[] = [
      { modelId, storeId, statusCode: 'IN_STOCK' },
    ];
    if (specs?.storage) {
      conditions.push({
        specs: {
          path: ['storage'],
          equals: specs.storage,
        },
      });
    }
    if (specs?.color) {
      conditions.push({
        specs: {
          path: ['color'],
          equals: specs.color,
        },
      });
    }
    return this.prisma.device.count({
      where: conditions.length === 1 ? conditions[0] : { AND: conditions },
    });
  }
}
