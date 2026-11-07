import { Injectable } from '@nestjs/common';
import { buildImageUrl } from '../common/lib/image-url.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AttributeDef } from './lib/attribute-schema.js';
import {
  DeviceModelInput,
  DeviceModelPatch,
  DeviceModelView,
} from './types/device-model.types.js';

interface ModelRow {
  id: string;
  brand: string;
  name: string;
  isActive: boolean;
  kindCode: string;
  categoryId: string | null;
  barcode: string | null;
  modelCode: string | null;
  customsCode: string | null;
  salePrice: Prisma.Decimal | null;
  imageFileName: string | null;
  attributes: unknown;
  colorImages?: { color: string; imageFileName: string }[] | null;
  createdAt: Date;
  updatedAt: Date;
}

function toView(row: ModelRow): DeviceModelView {
  const colorImages: Record<string, string> = {};
  if (Array.isArray(row.colorImages)) {
    for (const item of row.colorImages) {
      const url = buildImageUrl(item.imageFileName);
      if (url) colorImages[item.color] = url;
    }
  }
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    isActive: row.isActive,
    kindCode: row.kindCode,
    categoryId: row.categoryId,
    barcode: row.barcode,
    modelCode: row.modelCode,
    customsCode: row.customsCode,
    salePrice: row.salePrice === null ? null : row.salePrice.toFixed(2),
    imageUrl: buildImageUrl(row.imageFileName),
    colorImages,
    attributes: (row.attributes ?? []) as AttributeDef[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** All Prisma access for the device-model catalog. */
@Injectable()
export class DeviceModelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DeviceModelView[]> {
    const rows = await this.prisma.deviceModel.findMany({
      include: { colorImages: true },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toView);
  }

  async findById(id: string): Promise<DeviceModelView | null> {
    const row = await this.prisma.deviceModel.findUnique({
      where: { id },
      include: { colorImages: true },
    });
    return row ? toView(row) : null;
  }

  /** True when the given stock kind exists and is active (IMEI/SERIAL/QUANTITY). */
  async kindIsActive(code: string): Promise<boolean> {
    const row = await this.prisma.productKind.findUnique({
      where: { code },
      select: { isActive: true },
    });
    return row?.isActive ?? false;
  }

  /** How many units a model has — guards changing its kind once stocked. */
  countUnits(modelId: string): Promise<number> {
    return this.prisma.device.count({ where: { modelId } });
  }

  /** The raw stored picture file name (to delete the old file on replace/remove). */
  async imageFileName(id: string): Promise<string | null> {
    const row = await this.prisma.deviceModel.findUnique({
      where: { id },
      select: { imageFileName: true },
    });
    return row?.imageFileName ?? null;
  }

  /** The stored picture file name for a color (to delete on replace/remove). */
  async colorImageFileName(
    modelId: string,
    color: string,
  ): Promise<string | null> {
    const row = await this.prisma.deviceModelColorImage.findUnique({
      where: { modelId_color: { modelId, color } },
      select: { imageFileName: true },
    });
    return row?.imageFileName ?? null;
  }

  async setColorImage(
    modelId: string,
    color: string,
    imageFileName: string,
  ): Promise<DeviceModelView> {
    await this.prisma.deviceModelColorImage.upsert({
      where: { modelId_color: { modelId, color } },
      create: { modelId, color, imageFileName },
      update: { imageFileName },
    });
    return (await this.findById(modelId))!;
  }

  async removeColorImage(
    modelId: string,
    color: string,
  ): Promise<DeviceModelView> {
    await this.prisma.deviceModelColorImage.deleteMany({
      where: { modelId, color },
    });
    return (await this.findById(modelId))!;
  }

  async create(input: DeviceModelInput): Promise<DeviceModelView> {
    const row = await this.prisma.deviceModel.create({
      data: {
        brand: input.brand,
        name: input.name,
        kindCode: input.kindCode,
        categoryId: input.categoryId ?? null,
        barcode: input.barcode ?? null,
        modelCode: input.modelCode ?? null,
        customsCode: input.customsCode ?? null,
        salePrice: input.salePrice ?? null,
        attributes: input.attributes as unknown as Prisma.InputJsonValue,
      },
      include: { colorImages: true },
    });
    return toView(row);
  }

  async update(id: string, patch: DeviceModelPatch): Promise<DeviceModelView> {
    const row = await this.prisma.deviceModel.update({
      where: { id },
      data: {
        brand: patch.brand,
        name: patch.name,
        isActive: patch.isActive,
        kindCode: patch.kindCode,
        categoryId: patch.categoryId,
        barcode: patch.barcode,
        modelCode: patch.modelCode,
        customsCode: patch.customsCode,
        salePrice: patch.salePrice,
        imageFileName: patch.imageFileName,
        attributes:
          patch.attributes === undefined
            ? undefined
            : (patch.attributes as unknown as Prisma.InputJsonValue),
      },
      include: { colorImages: true },
    });
    return toView(row);
  }
}
