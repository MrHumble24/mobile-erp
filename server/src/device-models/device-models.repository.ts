import { Injectable } from '@nestjs/common';
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
  attributes: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function toView(row: ModelRow): DeviceModelView {
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
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toView);
  }

  async findById(id: string): Promise<DeviceModelView | null> {
    const row = await this.prisma.deviceModel.findUnique({ where: { id } });
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
        attributes: input.attributes as unknown as Prisma.InputJsonValue,
      },
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
        attributes:
          patch.attributes === undefined
            ? undefined
            : (patch.attributes as unknown as Prisma.InputJsonValue),
      },
    });
    return toView(row);
  }
}
