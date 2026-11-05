import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ANY_STORAGE } from './lib/price-resolution.js';

type Tx = Prisma.TransactionClient;

export interface ProductPriceRow {
  storage: string;
  levelCode: string;
  price: Prisma.Decimal;
}
export interface UnitPriceRow {
  levelCode: string;
  price: Prisma.Decimal;
}

/** One (storage, level, price) to write; `price` null deletes the row. */
export interface ProductPriceWrite {
  storage: string;
  levelCode: string;
  price: Prisma.Decimal | null;
}
export interface UnitPriceWrite {
  levelCode: string;
  price: Prisma.Decimal | null;
}

/** All Prisma access for pricing tables. The only pricing file touching Prisma. */
@Injectable()
export class PricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  activeLevels() {
    return this.prisma.priceLevel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, label: true },
    });
  }

  async levelExists(code: string): Promise<boolean> {
    const row = await this.prisma.priceLevel.findFirst({
      where: { code, isActive: true },
      select: { code: true },
    });
    return row !== null;
  }

  async productPricesByModel(
    modelIds: string[],
  ): Promise<Map<string, ProductPriceRow[]>> {
    const rows = await this.prisma.productPrice.findMany({
      where: { modelId: { in: modelIds } },
      select: { modelId: true, storage: true, levelCode: true, price: true },
    });
    return groupBy(rows, (r) => r.modelId);
  }

  async unitPricesByDevice(
    deviceIds: string[],
  ): Promise<Map<string, UnitPriceRow[]>> {
    const rows = await this.prisma.unitPrice.findMany({
      where: { deviceId: { in: deviceIds } },
      select: { deviceId: true, levelCode: true, price: true },
    });
    return groupBy(rows, (r) => r.deviceId);
  }

  product(modelId: string) {
    return this.prisma.deviceModel.findUnique({
      where: { id: modelId },
      select: { id: true, kindCode: true, salePrice: true },
    });
  }

  productPrices(modelId: string): Promise<ProductPriceRow[]> {
    return this.prisma.productPrice.findMany({
      where: { modelId },
      orderBy: [{ storage: 'asc' }, { levelCode: 'asc' }],
      select: { storage: true, levelCode: true, price: true },
    });
  }

  unit(deviceId: string) {
    return this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { id: true, targetPrice: true },
    });
  }

  unitPrices(deviceId: string): Promise<UnitPriceRow[]> {
    return this.prisma.unitPrice.findMany({
      where: { deviceId },
      orderBy: { levelCode: 'asc' },
      select: { levelCode: true, price: true },
    });
  }

  /**
   * Replace a product's prices in one transaction. RETAIL at "any storage"
   * writes `DeviceModel.salePrice` (the single source for a quantity product's
   * retail price); everything else is a `product_prices` row.
   */
  async writeProductPrices(
    modelId: string,
    writes: ProductPriceWrite[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const w of writes) {
        if (w.levelCode === 'RETAIL' && w.storage === ANY_STORAGE) {
          await tx.deviceModel.update({
            where: { id: modelId },
            data: { salePrice: w.price },
          });
          continue;
        }
        await this.upsertProductRow(tx, modelId, w);
      }
    });
  }

  private async upsertProductRow(
    tx: Tx,
    modelId: string,
    w: ProductPriceWrite,
  ): Promise<void> {
    const where = {
      modelId_storage_levelCode: {
        modelId,
        storage: w.storage,
        levelCode: w.levelCode,
      },
    };
    if (w.price === null) {
      await tx.productPrice.deleteMany({
        where: { modelId, storage: w.storage, levelCode: w.levelCode },
      });
      return;
    }
    await tx.productPrice.upsert({
      where,
      create: {
        modelId,
        storage: w.storage,
        levelCode: w.levelCode,
        price: w.price,
      },
      update: { price: w.price },
    });
  }

  /** Replace a unit's own prices. RETAIL writes `Device.targetPrice`. */
  async writeUnitPrices(
    deviceId: string,
    writes: UnitPriceWrite[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const w of writes) {
        if (w.levelCode === 'RETAIL') {
          await tx.device.update({
            where: { id: deviceId },
            data: { targetPrice: w.price },
          });
          continue;
        }
        if (w.price === null) {
          await tx.unitPrice.deleteMany({
            where: { deviceId, levelCode: w.levelCode },
          });
          continue;
        }
        await tx.unitPrice.upsert({
          where: { deviceId_levelCode: { deviceId, levelCode: w.levelCode } },
          create: { deviceId, levelCode: w.levelCode, price: w.price },
          update: { price: w.price },
        });
      }
    });
  }
}

function groupBy<T, K>(rows: T[], key: (r: T) => string): Map<string, K[]> {
  const map = new Map<string, K[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row as unknown as K);
    else map.set(k, [row as unknown as K]);
  }
  return map;
}
