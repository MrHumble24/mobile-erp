import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { resolveCustomerId } from '../common/lib/resolve-customer.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateRepairDto } from './dto/create-repair.dto.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { UpdateRepairDto } from './dto/update-repair.dto.js';
import { isLegalMove, isTerminal } from './lib/repair-status.js';
import { RepairsReadService } from './repairs-read.service.js';
import {
  RepairsWriteRepository,
  type CreateTicketData,
  type UpdateTicketData,
} from './repairs.write.repository.js';
import type { RepairView } from './types/repair.types.js';

const ZERO = new Prisma.Decimal(0);

/** The codes clients watch for on illegal transitions and owed hand-overs. */
export const REPAIR_ILLEGAL_MOVE = 'REPAIR_ILLEGAL_MOVE';
export const REPAIR_TERMINAL = 'REPAIR_TERMINAL';
export const REPAIR_BALANCE_OWED = 'REPAIR_BALANCE_OWED';

/** Repair ticket lifecycle: create, edit details, change status (ADR 0040). */
@Injectable()
export class RepairsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService,
    private readonly read: RepairsReadService,
    private readonly writes: RepairsWriteRepository,
  ) {}

  async create(
    caller: AuthenticatedUser,
    dto: CreateRepairDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    assertMasterExclusive(dto.masterUserId, dto.outsideMasterName);
    const customerId = await this.resolveCustomer(dto);
    if (dto.modelId) await this.assertModelExists(dto.modelId);
    const base = this.toCreateData(caller.id, customerId, dto);
    base.storeId = await this.stores.currentStoreId();
    const id = await this.createWithNumber(base);
    return this.read.get(caller, id);
  }

  async update(
    caller: AuthenticatedUser,
    id: string,
    dto: UpdateRepairDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const raw = await this.read.require(id);
    if (isTerminal(raw.statusCode)) {
      throw new ConflictException({
        code: REPAIR_TERMINAL,
        message: 'A given-back or cancelled ticket cannot be edited',
      });
    }
    await this.writes.updateDetails(id, this.toUpdateData(dto));
    return this.read.get(caller, id);
  }

  async changeStatus(
    caller: AuthenticatedUser,
    id: string,
    dto: ChangeStatusDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const raw = await this.read.require(id);
    const from = raw.statusCode;
    if (!isLegalMove(from, dto.toStatusCode)) {
      throw new ConflictException({
        code: REPAIR_ILLEGAL_MOVE,
        message: `Cannot move a ticket from ${from} to ${dto.toStatusCode}`,
      });
    }
    if (dto.toStatusCode === 'GIVEN_BACK')
      this.assertCanGiveBack(raw, dto.note);
    await this.writes.transaction((tx) =>
      this.writes.changeStatus(
        tx,
        id,
        from,
        dto.toStatusCode,
        caller.id,
        dto.note,
      ),
    );
    return this.read.get(caller, id);
  }

  /** Giving back with money still owed needs a reason (ADR 0040). */
  private assertCanGiveBack(
    raw: {
      agreedPrice: Prisma.Decimal;
      payments: { amount: Prisma.Decimal }[];
    },
    note: string | undefined,
  ): void {
    const paid = raw.payments.reduce((s, p) => s.plus(p.amount), ZERO);
    const owed = raw.agreedPrice.minus(paid);
    if (owed.greaterThan(ZERO) && !note?.trim()) {
      throw new ConflictException({
        code: REPAIR_BALANCE_OWED,
        message: `${owed.toFixed(2)} is still owed; a reason is required to give the phone back`,
      });
    }
  }

  private async createWithNumber(base: CreateTicketData): Promise<string> {
    // ponytail: ticket numbers race under concurrency; the unique index rejects
    // a clash and we retry a few times. Fine at single-shop volume.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.writes.transaction(async (tx) => {
          const number = await this.writes.nextTicketNumber(tx, base.storeId);
          return this.writes.createTicket(tx, number, base);
        });
      } catch (error) {
        if (isUniqueViolation(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictException('Could not allocate a ticket number, retry');
  }

  private async resolveCustomer(dto: CreateRepairDto): Promise<string> {
    if (dto.customerId) {
      const found = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (!found) {
        throw new BadRequestException(`Customer ${dto.customerId} not found`);
      }
      return found.id;
    }
    const id = await resolveCustomerId(this.prisma, {
      inlineCustomer: dto.customer,
    });
    if (!id) {
      throw new BadRequestException(
        'A ticket needs a customer: customerId or a name (and phone)',
      );
    }
    return id;
  }

  private async assertModelExists(modelId: string): Promise<void> {
    const model = await this.prisma.deviceModel.findUnique({
      where: { id: modelId },
      select: { id: true },
    });
    if (!model) throw new BadRequestException(`Model ${modelId} not found`);
  }

  private toCreateData(
    receivedById: string,
    customerId: string,
    dto: CreateRepairDto,
  ): CreateTicketData {
    return {
      storeId: '', // filled below
      customerId,
      deviceName: dto.deviceName,
      modelId: dto.modelId,
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

  private toUpdateData(dto: UpdateRepairDto): UpdateTicketData {
    const data: UpdateTicketData = {
      deviceName: dto.deviceName,
      modelId: dto.modelId,
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
      data.outsideCost = new Prisma.Decimal(dto.outsideCost);
    // Switching master side keeps the XOR: setting one clears the other.
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
}

function assertMasterExclusive(
  masterUserId?: string,
  outsideMasterName?: string,
): void {
  if (masterUserId && outsideMasterName) {
    throw new BadRequestException(
      'A ticket has one master: an own master or an outside one, not both',
    );
  }
}
