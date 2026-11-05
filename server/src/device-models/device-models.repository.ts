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

  async create(input: DeviceModelInput): Promise<DeviceModelView> {
    const row = await this.prisma.deviceModel.create({
      data: {
        brand: input.brand,
        name: input.name,
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
