import { Injectable } from '@nestjs/common';
import { buildImageUrl } from '../common/lib/image-url.js';
import type { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DeviceChange } from './types/sync.types.js';

const PAGE_SIZE = 2000;

/**
 * Read-only offline-cache feed. Selects NO cost columns (acquisitionCost /
 * landedCost) at all, independent of the redaction interceptor.
 */
@Injectable()
export class SyncChangesRepository {
  constructor(private readonly prisma: PrismaService) {}

  readonly pageSize = PAGE_SIZE;

  /**
   * Units of ONE store changed since `since` (ADR 0045: a branch never sees
   * another branch's stock, online or in the offline cache).
   * ponytail: a unit transferred away simply stops appearing, so the old
   * store's cache keeps its last row until the next full pull (store switch or
   * sign-in). Add tombstones if stale rows ever matter.
   */
  async devicesSince(since: Date, storeId: string): Promise<DeviceChange[]> {
    const rows = await this.prisma.device.findMany({
      where: { updatedAt: { gt: since }, storeId },
      orderBy: { updatedAt: 'asc' },
      take: PAGE_SIZE,
      select: {
        id: true,
        imei: true,
        imei2: true,
        serialNumber: true,
        statusCode: true,
        version: true,
        targetPrice: true,
        specs: true,
        updatedAt: true,
        model: {
          select: {
            id: true,
            brand: true,
            name: true,
            kindCode: true,
            categoryId: true,
            imageFileName: true,
          },
        },
        sales: {
          orderBy: { soldAt: 'desc' },
          take: 1,
          select: {
            id: true,
            soldAt: true,
            salePrice: true,
            warranty: { select: { endsAt: true } },
          },
        },
        inspections: {
          orderBy: { inspectedAt: 'desc' },
          take: 1,
          select: { gradeCode: true, notes: true },
        },
      },
    });
    return rows.map(toDeviceChange);
  }
}

type DeviceRow = {
  id: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  statusCode: string;
  version: number;
  targetPrice: Prisma.Decimal | null;
  specs: Prisma.JsonValue;
  updatedAt: Date;
  model: {
    id: string;
    brand: string;
    name: string;
    kindCode: string;
    categoryId: string | null;
    imageFileName: string | null;
  };
  sales: {
    id: string;
    soldAt: Date;
    salePrice: Prisma.Decimal;
    warranty: { endsAt: Date } | null;
  }[];
  inspections: { gradeCode: string | null; notes: string | null }[];
};

function toDeviceChange(row: DeviceRow): DeviceChange {
  const sale = row.sales[0];
  const inspection = row.inspections[0];
  return {
    id: row.id,
    imei: row.imei,
    imei2: row.imei2,
    serialNumber: row.serialNumber,
    statusCode: row.statusCode,
    version: row.version,
    targetPrice: row.targetPrice === null ? null : row.targetPrice.toFixed(2),
    specs: row.specs,
    model: {
      id: row.model.id,
      brand: row.model.brand,
      name: row.model.name,
      kindCode: row.model.kindCode,
      categoryId: row.model.categoryId,
      imageUrl: buildImageUrl(row.model.imageFileName),
    },
    latestSale: sale
      ? {
          id: sale.id,
          soldAt: sale.soldAt,
          salePrice: sale.salePrice.toFixed(2),
          warrantyEndsAt: sale.warranty?.endsAt ?? null,
        }
      : null,
    latestInspection: inspection
      ? { gradeCode: inspection.gradeCode, notes: inspection.notes }
      : null,
    prices: {}, // filled by SyncChangesService from PricingService
    updatedAt: row.updatedAt,
  };
}
