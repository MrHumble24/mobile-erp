import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toDeviceView } from './lib/device-view.mapper.js';
import {
  DeviceDetailView,
  DeviceFilters,
  DeviceStatusHistoryView,
  DeviceView,
  PaginatedDevices,
} from './types/device.types.js';

const inspectionSummarySelect = {
  id: true,
  passed: true,
  gradeCode: true,
  batteryHealth: true,
  inspectedAt: true,
} as const;

/** Read-side Prisma access for devices (list, lookup, history). */
@Injectable()
export class DevicesQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filters: DeviceFilters,
    page: number,
    pageSize: number,
  ): Promise<PaginatedDevices> {
    const where = buildWhere(filters);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.device.findMany({
        where,
        orderBy: { intakeDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          inspections: {
            orderBy: { inspectedAt: 'desc' },
            take: 1,
            select: inspectionSummarySelect,
          },
        },
      }),
      this.prisma.device.count({ where }),
    ]);
    const items = rows.map((row) => ({
      ...toDeviceView(row),
      latestInspection: row.inspections[0] ?? null,
    }));
    return { items, total, page, pageSize };
  }

  /** Devices still owing a first QC pass: in stock or defective, never inspected. */
  countAwaitingInspection(): Promise<number> {
    return this.prisma.device.count({
      where: {
        statusCode: { in: ['IN_STOCK', 'DEFECTIVE'] },
        inspections: { none: {} },
      },
    });
  }

  async findById(id: string): Promise<DeviceView | null> {
    const row = await this.prisma.device.findUnique({ where: { id } });
    return row ? toDeviceView(row) : null;
  }

  async findDetailByImei(imei: string): Promise<DeviceDetailView | null> {
    const row = await this.prisma.device.findUnique({
      where: { imei },
      include: {
        model: { select: { id: true, brand: true, name: true } },
        status: { select: { code: true, label: true } },
        inspections: {
          orderBy: { inspectedAt: 'desc' },
          take: 1,
          select: inspectionSummarySelect,
        },
      },
    });
    if (!row) return null;
    return {
      ...toDeviceView(row),
      model: row.model,
      status: row.status,
      latestInspection: row.inspections[0] ?? null,
    };
  }

  findHistory(deviceId: string): Promise<DeviceStatusHistoryView[]> {
    return this.prisma.deviceStatusHistory.findMany({
      where: { deviceId },
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        fromStatusCode: true,
        toStatusCode: true,
        changedById: true,
        reason: true,
        changedAt: true,
      },
    });
  }
}

function buildWhere(filters: DeviceFilters): Prisma.DeviceWhereInput {
  const where: Prisma.DeviceWhereInput = {};
  if (filters.imei) where.imei = filters.imei;
  if (filters.modelId) where.modelId = filters.modelId;
  if (filters.shipmentId) where.shipmentId = filters.shipmentId;
  if (filters.statusCode) where.statusCode = filters.statusCode;
  if (filters.inspected === 'true') where.inspections = { some: {} };
  if (filters.inspected === 'false') where.inspections = { none: {} };
  if (filters.storage) {
    where.specs = { path: ['storage'], equals: filters.storage };
  }
  if (filters.search) {
    where.OR = [
      { imei: { contains: filters.search, mode: 'insensitive' } },
      { model: { brand: { contains: filters.search, mode: 'insensitive' } } },
      { model: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }
  return where;
}
