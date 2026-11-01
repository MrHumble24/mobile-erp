import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toDeviceView } from './lib/device-view.mapper.js';
import {
  DeviceDetailsPatch,
  DeviceView,
  StatusChangeInput,
} from './types/device.types.js';
import { OptimisticLockError } from './types/optimistic-lock.error.js';

/** Write-side Prisma access for devices (details edit, status transitions). */
@Injectable()
export class DevicesStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  findState(
    id: string,
  ): Promise<{ statusCode: string; version: number } | null> {
    return this.prisma.device.findUnique({
      where: { id },
      select: { statusCode: true, version: true },
    });
  }

  async updateDetails(
    id: string,
    patch: DeviceDetailsPatch,
  ): Promise<DeviceView> {
    const data: Prisma.DeviceUpdateInput = {};
    if (patch.specs !== undefined) {
      data.specs = patch.specs as Prisma.InputJsonValue;
    }
    if (patch.targetPrice !== undefined) data.targetPrice = patch.targetPrice;
    const row = await this.prisma.device.update({ where: { id }, data });
    return toDeviceView(row);
  }

  /**
   * Transition inside one transaction: version-guarded update + history row.
   * Throws {@link OptimisticLockError} when the version guard matches no row.
   */
  applyStatusChange(input: StatusChangeInput): Promise<DeviceView> {
    return this.prisma.$transaction(async (tx) => {
      const res = await tx.device.updateMany({
        where: { id: input.deviceId, version: input.expectedVersion },
        data: { statusCode: input.toStatusCode, version: { increment: 1 } },
      });
      if (res.count === 0) throw new OptimisticLockError();
      await tx.deviceStatusHistory.create({
        data: {
          deviceId: input.deviceId,
          fromStatusCode: input.fromStatusCode,
          toStatusCode: input.toStatusCode,
          changedById: input.changedById,
          reason: input.reason ?? null,
        },
      });
      const row = await tx.device.findUniqueOrThrow({
        where: { id: input.deviceId },
      });
      return toDeviceView(row);
    });
  }
}
