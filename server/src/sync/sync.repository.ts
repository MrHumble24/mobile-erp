import { Injectable } from '@nestjs/common';
import { unitCodeWhere } from '../devices/lib/unit-code.js';
import type { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ConflictView, StoredMutation } from './types/sync.types.js';

const conflictWithImei = {
  id: true,
  deviceId: true,
  terminalId: true,
  attemptedChange: true,
  baseVersion: true,
  resolvedAt: true,
  resolution: true,
  createdAt: true,
  device: { select: { imei: true, imei2: true, serialNumber: true } },
} as const;

/** Device lookups and sync_conflicts persistence for the push/resolve flow. */
@Injectable()
export class SyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deviceIdByCode(code: string): Promise<string | null> {
    const row = await this.prisma.device.findFirst({
      where: unitCodeWhere(code),
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async deviceIdByConsignment(consignmentId: string): Promise<string | null> {
    const row = await this.prisma.consignment.findUnique({
      where: { id: consignmentId },
      select: { deviceId: true },
    });
    return row?.deviceId ?? null;
  }

  async currentDeviceVersion(deviceId: string): Promise<number | null> {
    const row = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { version: true },
    });
    return row?.version ?? null;
  }

  async insertConflict(input: {
    deviceId: string;
    terminalId: string;
    attemptedChange: StoredMutation;
    baseVersion: number;
  }): Promise<{ id: string }> {
    const row = await this.prisma.syncConflict.create({
      data: {
        deviceId: input.deviceId,
        terminalId: input.terminalId,
        attemptedChange:
          input.attemptedChange as unknown as Prisma.InputJsonValue,
        baseVersion: input.baseVersion,
      },
      select: { id: true },
    });
    return row;
  }

  async listPending(): Promise<ConflictView[]> {
    const rows = await this.prisma.syncConflict.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'asc' },
      select: conflictWithImei,
    });
    return rows.map(toConflictView);
  }

  async findForResolve(id: string): Promise<{
    id: string;
    deviceId: string;
    attemptedChange: StoredMutation;
    resolvedAt: Date | null;
  } | null> {
    const row = await this.prisma.syncConflict.findUnique({
      where: { id },
      select: {
        id: true,
        deviceId: true,
        attemptedChange: true,
        resolvedAt: true,
      },
    });
    if (!row) return null;
    return {
      ...row,
      attemptedChange: row.attemptedChange as unknown as StoredMutation,
    };
  }

  async resolve(
    id: string,
    input: { resolvedById: string; resolution: string },
  ): Promise<ConflictView> {
    const row = await this.prisma.syncConflict.update({
      where: { id },
      data: {
        resolvedById: input.resolvedById,
        resolution: input.resolution,
        resolvedAt: new Date(),
      },
      select: conflictWithImei,
    });
    return toConflictView(row);
  }
}

function toConflictView(row: {
  id: string;
  deviceId: string;
  terminalId: string;
  attemptedChange: Prisma.JsonValue;
  baseVersion: number;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  device: {
    imei: string | null;
    imei2: string | null;
    serialNumber: string | null;
  };
}): ConflictView {
  return {
    id: row.id,
    deviceId: row.deviceId,
    imei: row.device.imei,
    imei2: row.device.imei2,
    serialNumber: row.device.serialNumber,
    terminalId: row.terminalId,
    attemptedChange: row.attemptedChange as unknown as StoredMutation,
    baseVersion: row.baseVersion,
    resolvedAt: row.resolvedAt,
    resolution: row.resolution,
    createdAt: row.createdAt,
  };
}
