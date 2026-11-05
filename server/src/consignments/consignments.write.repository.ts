import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unitCodeWhere } from '../devices/lib/unit-code.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toConsignmentView, withImei } from './lib/consignment.mapper.js';
import {
  ConsignmentView,
  CreateTransferInput,
  ReturnInput,
  SettleInput,
} from './types/consignment.types.js';

type Tx = Prisma.TransactionClient;

/** Device fields needed to flip status under the optimistic lock. */
interface DeviceLock {
  id: string;
  statusCode: string;
  version: number;
  landedCost: Prisma.Decimal;
}

/**
 * Write-side Prisma access for consignments. Device/Sale rows are written here
 * only to keep each resolution atomic — see README "cross-module writes".
 */
@Injectable()
export class ConsignmentsWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransfer(input: CreateTransferInput): Promise<ConsignmentView> {
    return this.prisma.$transaction(async (tx) => {
      const device = await this.loadDeviceByCode(tx, input.code);
      if (device.statusCode !== 'IN_STOCK') {
        throw new ConflictException(
          `Device ${input.code} is ${device.statusCode}, not IN_STOCK`,
        );
      }
      await this.moveDevice(tx, device, 'CONSIGNED', input.expectedVersion, {
        changedById: input.createdById,
        reason: 'consignment',
      });
      const row = await tx.consignment.create({
        data: {
          storeId: input.storeId,
          clientMutationId: input.clientMutationId,
          partnerId: input.partnerId,
          deviceId: device.id,
          agreedPrice: input.agreedPrice,
          dueDate: input.dueDate,
          statusCode: 'OUT',
          createdById: input.createdById,
        },
        include: withImei,
      });
      return toConsignmentView(row);
    });
  }

  async settle(id: string, input: SettleInput): Promise<ConsignmentView> {
    return this.prisma.$transaction(async (tx) => {
      const c = await this.loadOut(tx, id);
      await this.moveDevice(tx, c.device, 'SOLD', input.expectedVersion, {
        changedById: input.soldById,
        reason: 'consignment settled',
      });
      await tx.sale.create({
        data: {
          // The sale belongs to the store that handed the device out, not to
          // the settling user's current store. Inherit the consignment's store.
          storeId: c.storeId,
          deviceId: c.device.id,
          consignmentId: id,
          soldById: input.soldById,
          salePrice: input.salePrice ?? c.agreedPrice,
          landedCostSnapshot: c.device.landedCost,
          notes: input.notes,
        },
      });
      return toConsignmentView(await this.resolve(tx, id, 'SETTLED'));
    });
  }

  async returnToStock(
    id: string,
    input: ReturnInput,
  ): Promise<ConsignmentView> {
    return this.prisma.$transaction(async (tx) => {
      const c = await this.loadOut(tx, id);
      const to = input.condition ?? 'IN_STOCK';
      await this.moveDevice(tx, c.device, to, input.expectedVersion, {
        changedById: input.changedById,
        reason: input.reason ?? 'consignment returned',
      });
      return toConsignmentView(await this.resolve(tx, id, 'RETURNED'));
    });
  }

  private async loadDeviceByCode(tx: Tx, code: string): Promise<DeviceLock> {
    const device = await tx.device.findFirst({
      where: unitCodeWhere(code),
      select: { id: true, statusCode: true, version: true, landedCost: true },
    });
    if (!device) throw new NotFoundException(`Device ${code} not found`);
    return device;
  }

  private async loadOut(
    tx: Tx,
    id: string,
  ): Promise<{
    storeId: string;
    agreedPrice: Prisma.Decimal;
    device: DeviceLock;
  }> {
    const c = await tx.consignment.findUnique({
      where: { id },
      select: {
        statusCode: true,
        storeId: true,
        agreedPrice: true,
        device: {
          select: {
            id: true,
            statusCode: true,
            version: true,
            landedCost: true,
          },
        },
      },
    });
    if (!c) throw new NotFoundException(`Consignment ${id} not found`);
    if (c.statusCode !== 'OUT') {
      throw new ConflictException(
        `Consignment ${id} is ${c.statusCode}, not OUT`,
      );
    }
    return { storeId: c.storeId, agreedPrice: c.agreedPrice, device: c.device };
  }

  /** Optimistic status change + history row. 409 on version mismatch. */
  private async moveDevice(
    tx: Tx,
    device: DeviceLock,
    to: string,
    expectedVersion: number | undefined,
    audit: { changedById: string; reason: string },
  ): Promise<void> {
    if (expectedVersion !== undefined && expectedVersion !== device.version) {
      throw new ConflictException(
        `Device version mismatch: expected ${expectedVersion}, found ${device.version}`,
      );
    }
    const res = await tx.device.updateMany({
      where: { id: device.id, version: device.version },
      data: { statusCode: to, version: { increment: 1 } },
    });
    if (res.count === 0) {
      throw new ConflictException('Device was modified concurrently');
    }
    await tx.deviceStatusHistory.create({
      data: {
        deviceId: device.id,
        fromStatusCode: device.statusCode,
        toStatusCode: to,
        changedById: audit.changedById,
        reason: audit.reason,
      },
    });
  }

  private resolve(tx: Tx, id: string, statusCode: string) {
    return tx.consignment.update({
      where: { id },
      data: { statusCode, resolvedAt: new Date() },
      include: withImei,
    });
  }
}
