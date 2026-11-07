import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { CreateRepairDto } from '../dto/create-repair.dto.js';
import { UpdateRepairDto } from '../dto/update-repair.dto.js';
import type {
  CreateTicketData,
  UpdateTicketData,
} from '../repairs.write.repository.js';

/** A ticket has one master, never both. Shared by create and update. */
export function assertMasterExclusive(
  masterUserId?: string,
  outsideMasterName?: string,
): void {
  if (masterUserId && outsideMasterName) {
    throw new BadRequestException(
      'A ticket has one master: an own master or an outside one, not both',
    );
  }
}

export function toCreateData(
  receivedById: string,
  customerId: string,
  storeId: string,
  dto: CreateRepairDto,
): CreateTicketData {
  return {
    storeId,
    customerId,
    deviceName: dto.deviceName,
    modelId: dto.modelId,
    deviceId: dto.deviceId,
    imei: dto.imei,
    serialNumber: dto.serialNumber,
    problem: dto.problem,
    agreedPrice: new Prisma.Decimal(dto.agreedPrice),
    warrantyDays: dto.warrantyDays,
    notes: dto.notes,
    masterUserId: dto.masterUserId,
    outsideMasterName: dto.outsideMasterName,
    outsideMasterPhone: dto.outsideMasterPhone,
    outsideCost:
      dto.outsideCost === undefined
        ? undefined
        : new Prisma.Decimal(dto.outsideCost),
    receivedById,
    receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
  };
}

/** Switching master side keeps the XOR: setting one clears the other. */
export function toUpdateData(dto: UpdateRepairDto): UpdateTicketData {
  const data: UpdateTicketData = {
    deviceName: dto.deviceName,
    modelId: dto.modelId,
    deviceId: dto.deviceId,
    imei: dto.imei,
    serialNumber: dto.serialNumber,
    problem: dto.problem,
    warrantyDays: dto.warrantyDays,
    notes: dto.notes,
    outsideMasterPhone: dto.outsideMasterPhone,
  };
  if (dto.agreedPrice !== undefined)
    data.agreedPrice = new Prisma.Decimal(dto.agreedPrice);
  if (dto.outsideCost !== undefined)
    data.outsideCost =
      dto.outsideCost === null ? null : new Prisma.Decimal(dto.outsideCost);
  if (dto.masterUserId !== undefined) {
    data.masterUserId = dto.masterUserId;
    data.outsideMasterName = null;
  }
  if (dto.outsideMasterName !== undefined) {
    data.outsideMasterName = dto.outsideMasterName;
    data.masterUserId = null;
  }
  return data;
}
