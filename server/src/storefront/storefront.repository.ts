import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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

export interface CreateOrderInput {
  storeId: string;
  modelId: string;
  specs: Record<string, unknown>;
  customerName: string;
  customerPhone: string;
  note?: string;
}

@Injectable()
export class StorefrontRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<StorefrontSettingsView> {
    const row = await this.prisma.storefrontSettings.findUnique({
      where: { id: 1 },
    });
    if (!row) {
      return {
        enabled: false,
        showPrices: true,
        contactPhone: null,
        contactTelegram: null,
        categoryIds: [],
      };
    }
    const catIds = Array.isArray(row.categoryIds)
      ? (row.categoryIds as string[])
      : [];
    return {
      enabled: row.enabled,
      showPrices: row.showPrices,
      contactPhone: row.contactPhone,
      contactTelegram: row.contactTelegram,
      categoryIds: catIds,
    };
  }

  async updateSettings(
    data: Partial<StorefrontSettingsView>,
  ): Promise<StorefrontSettingsView> {
    const updatePayload: Prisma.StorefrontSettingsUpdateInput = {};
    if (data.enabled !== undefined) updatePayload.enabled = data.enabled;
    if (data.showPrices !== undefined)
      updatePayload.showPrices = data.showPrices;
    if (data.contactPhone !== undefined)
      updatePayload.contactPhone = data.contactPhone;
    if (data.contactTelegram !== undefined)
      updatePayload.contactTelegram = data.contactTelegram;
    if (data.categoryIds !== undefined)
      updatePayload.categoryIds = data.categoryIds;

    const row = await this.prisma.storefrontSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        enabled: data.enabled ?? false,
        showPrices: data.showPrices ?? true,
        contactPhone: data.contactPhone ?? null,
        contactTelegram: data.contactTelegram ?? null,
        categoryIds: data.categoryIds ?? [],
      },
      update: updatePayload,
    });

    const catIds = Array.isArray(row.categoryIds)
      ? (row.categoryIds as string[])
      : [];
    return {
      enabled: row.enabled,
      showPrices: row.showPrices,
      contactPhone: row.contactPhone,
      contactTelegram: row.contactTelegram,
      categoryIds: catIds,
    };
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

  findActiveModels(
    allowedCategoryIds?: string[],
    categoryId?: string,
    search?: string,
  ): Promise<PublicModelRow[]> {
    const where: Prisma.DeviceModelWhereInput = { isActive: true };

    if (allowedCategoryIds && allowedCategoryIds.length > 0) {
      where.categoryId = { in: allowedCategoryIds };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    const term = search?.trim();
    if (term) {
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { modelCode: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.deviceModel.findMany({
      where,
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
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
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

    const grouped = await this.prisma.stockMovement.groupBy({
      by: ['modelId', 'storeId'],
      where: {
        modelId: { in: modelIds },
        storeId: { in: storeIds },
      },
      _sum: { quantity: true },
    });

    for (const row of grouped) {
      if (!result.has(row.modelId)) {
        result.set(row.modelId, new Map());
      }
      result.get(row.modelId)!.set(row.storeId, row._sum.quantity ?? 0);
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
      const agg = await this.prisma.stockMovement.aggregate({
        where: { modelId, storeId },
        _sum: { quantity: true },
      });
      return agg._sum.quantity ?? 0;
    }

    const where: Prisma.DeviceWhereInput = {
      modelId,
      storeId,
      statusCode: 'IN_STOCK',
    };
    if (specs?.storage) {
      where.specs = {
        path: ['storage'],
        equals: specs.storage,
      };
    }
    return this.prisma.device.count({ where });
  }

  async createOrder(input: CreateOrderInput): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.storefrontOrder.create({
        data: {
          storeId: input.storeId,
          modelId: input.modelId,
          specs: input.specs as Prisma.InputJsonValue,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          note: input.note ?? null,
          statusCode: 'NEW',
        },
        select: { id: true },
      });

      await tx.storefrontOrderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatusCode: 'NEW',
          note: 'Online order created',
        },
      });

      return order;
    });
  }
}
