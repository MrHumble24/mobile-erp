import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeLandedCost } from './lib/landed-cost.js';
import {
  RegisteredDeviceView,
  RegisterDeviceInput,
  ShipmentInput,
  ShipmentPatch,
  ShipmentView,
} from './types/shipment.types.js';

const withCount = {
  include: { _count: { select: { devices: true } } },
} as const;

/** All Prisma access for shipments, including batched device intake. */
@Injectable()
export class ShipmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ShipmentView[]> {
    const rows = await this.prisma.shipment.findMany({
      orderBy: { shipmentDate: 'desc' },
      ...withCount,
    });
    return rows.map(toShipmentView);
  }

  async findById(id: string): Promise<ShipmentView | null> {
    const row = await this.prisma.shipment.findUnique({
      where: { id },
      ...withCount,
    });
    return row ? toShipmentView(row) : null;
  }

  async create(input: ShipmentInput): Promise<ShipmentView> {
    const row = await this.prisma.shipment.create({
      data: { ...input },
      ...withCount,
    });
    return toShipmentView(row);
  }

  /** Updates fields and, when overhead changes, recomputes landed costs. */
  async update(id: string, patch: ShipmentPatch): Promise<ShipmentView> {
    return this.prisma.$transaction(async (tx) => {
      await tx.shipment.update({ where: { id }, data: patch });
      if (patch.overheadCost !== undefined) await this.recompute(tx, id);
      const row = await tx.shipment.findUniqueOrThrow({
        where: { id },
        ...withCount,
      });
      return toShipmentView(row);
    });
  }

  async addDevices(
    shipmentId: string,
    inputs: RegisterDeviceInput[],
    userId: string,
  ): Promise<RegisteredDeviceView[]> {
    return this.prisma.$transaction(async (tx) => {
      for (const input of inputs) {
        await tx.device.create({
          data: {
            imei: input.imei,
            shipmentId,
            modelId: input.modelId,
            specs: input.specs as Prisma.InputJsonValue,
            acquisitionCost: input.acquisitionCost,
            landedCost: input.acquisitionCost,
            targetPrice: input.targetPrice ?? null,
            statusCode: 'IN_STOCK',
            statusHistory: {
              create: { toStatusCode: 'IN_STOCK', changedById: userId },
            },
          },
        });
      }
      return this.recompute(tx, shipmentId);
    });
  }

  private async recompute(
    tx: Prisma.TransactionClient,
    shipmentId: string,
  ): Promise<RegisteredDeviceView[]> {
    const shipment = await tx.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      select: { overheadCost: true },
    });
    const devices = await tx.device.findMany({
      where: { shipmentId },
      orderBy: { intakeDate: 'asc' },
      select: {
        id: true,
        imei: true,
        modelId: true,
        acquisitionCost: true,
        targetPrice: true,
        statusCode: true,
      },
    });
    const overhead = shipment.overheadCost.toNumber();
    const results: RegisteredDeviceView[] = [];
    for (const d of devices) {
      const landedCost = computeLandedCost(
        d.acquisitionCost.toNumber(),
        overhead,
        devices.length,
      );
      await tx.device.update({ where: { id: d.id }, data: { landedCost } });
      results.push({
        id: d.id,
        imei: d.imei,
        modelId: d.modelId,
        acquisitionCost: d.acquisitionCost.toString(),
        landedCost,
        targetPrice: d.targetPrice ? d.targetPrice.toString() : null,
        statusCode: d.statusCode,
      });
    }
    return results;
  }
}

interface ShipmentRow {
  id: string;
  supplierId: string;
  shipmentDate: Date;
  expectedCount: number;
  overheadCost: { toString(): string };
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { devices: number };
}

function toShipmentView(row: ShipmentRow): ShipmentView {
  return {
    id: row.id,
    supplierId: row.supplierId,
    shipmentDate: row.shipmentDate,
    expectedCount: row.expectedCount,
    overheadCost: row.overheadCost.toString(),
    notes: row.notes,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deviceCount: row._count.devices,
  };
}
