import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  isUniqueViolation,
  uniqueViolationFields,
} from '../common/lib/prisma-errors.js';
import { resolveCustomerId } from '../common/lib/resolve-customer.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateRepairDto } from './dto/create-repair.dto.js';
import { UpdateRepairDto } from './dto/update-repair.dto.js';
import { commitMutation, replayDuplicate } from './lib/repair-mutation.js';
import { isLegalMove, isTerminal } from './lib/repair-status.js';
import {
  assertMasterExclusive,
  toCreateData,
  toUpdateData,
} from './lib/repair-write-data.js';
import { RepairIdempotency } from './repair-idempotency.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';
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
    private readonly idem: RepairIdempotency,
  ) {}

  async create(
    caller: AuthenticatedUser,
    dto: CreateRepairDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const replayed = await this.idem.replay(caller, dto.clientMutationId);
    if (replayed) return replayed;
    assertMasterExclusive(dto.masterUserId, dto.outsideMasterName);
    await this.assertRefsExist(dto.modelId, dto.masterUserId, dto.deviceId);
    const storeId = await this.stores.currentStoreId();
    try {
      const id = await this.createWithNumber(caller, storeId, dto);
      return this.read.get(caller, id);
    } catch (error) {
      const dup = await replayDuplicate(
        error,
        this.idem,
        this.read,
        caller,
        dto.clientMutationId,
      );
      if (dup) return dup;
      throw error;
    }
  }

  async update(
    caller: AuthenticatedUser,
    id: string,
    dto: UpdateRepairDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const replayed = await this.idem.replay(caller, dto.clientMutationId);
    if (replayed) return replayed;
    const raw = await this.read.require(id);
    if (isTerminal(raw.statusCode)) {
      throw new ConflictException({
        code: REPAIR_TERMINAL,
        message: 'A given-back or cancelled ticket cannot be edited',
      });
    }
    assertMasterExclusive(dto.masterUserId, dto.outsideMasterName);
    await this.assertRefsExist(dto.modelId, dto.masterUserId, dto.deviceId);
    const data = toUpdateData(dto);
    return commitMutation(
      this.idem,
      this.read,
      caller,
      dto.clientMutationId,
      id,
      () =>
        this.writes.transaction(async (tx) => {
          await this.writes.updateDetails(tx, id, data, raw.version);
          await this.idem.record(tx, dto.clientMutationId, id, 'update');
        }),
    );
  }

  async changeStatus(
    caller: AuthenticatedUser,
    id: string,
    dto: ChangeStatusDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const replayed = await this.idem.replay(caller, dto.clientMutationId);
    if (replayed) return replayed;
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
    return commitMutation(
      this.idem,
      this.read,
      caller,
      dto.clientMutationId,
      id,
      () =>
        this.writes.transaction(async (tx) => {
          await this.writes.changeStatus(
            tx,
            id,
            from,
            dto.toStatusCode,
            caller.id,
            dto.note,
            raw.version,
          );
          await this.idem.record(tx, dto.clientMutationId, id, 'status');
        }),
    );
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

  private async createWithNumber(
    caller: AuthenticatedUser,
    storeId: string,
    dto: CreateRepairDto,
  ): Promise<string> {
    // Ticket numbers race under concurrency; the unique index rejects a clash
    // and we retry. The customer upsert and the mutation key share this tx, so
    // neither is left behind when ticket creation fails / a duplicate key wins.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.writes.transaction(async (tx) => {
          const customerId = await this.resolveCustomer(tx, dto);
          const number = await this.writes.nextTicketNumber(tx, storeId);
          const base = toCreateData(caller.id, customerId, storeId, dto);
          const id = await this.writes.createTicket(tx, number, base);
          await this.idem.record(tx, dto.clientMutationId, id, 'create');
          return id;
        });
      } catch (error) {
        // A clash on the mutation key means a concurrent duplicate already
        // committed — let it propagate for replay. A ticket-number clash is
        // the only unique violation we retry locally.
        const keyClash = uniqueViolationFields(error).some((field) =>
          field.includes('clientMutationId'),
        );
        if (isUniqueViolation(error) && !keyClash && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictException('Could not allocate a ticket number, retry');
  }

  /** Resolve the customer inside the write transaction (no orphan customer). */
  private async resolveCustomer(
    tx: PrismaTx,
    dto: CreateRepairDto,
  ): Promise<string> {
    if (dto.customerId) {
      const found = await tx.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (!found) {
        throw new BadRequestException(`Customer ${dto.customerId} not found`);
      }
      return found.id;
    }
    const id = await resolveCustomerId(tx, { inlineCustomer: dto.customer });
    if (!id) {
      throw new BadRequestException(
        'A ticket needs a customer: customerId or a name (and phone)',
      );
    }
    return id;
  }

  /** Validate referenced catalogue model / master user / stock unit ids
   *  (create + update). A linked device must belong to the active store. */
  private async assertRefsExist(
    modelId?: string,
    masterUserId?: string,
    deviceId?: string | null,
  ): Promise<void> {
    if (deviceId) {
      const storeId = await this.stores.currentStoreId();
      const device = await this.prisma.device.findFirst({
        where: { id: deviceId, storeId },
        select: { id: true },
      });
      if (!device) {
        throw new BadRequestException(
          `Device ${deviceId} not found in this store`,
        );
      }
    }
    if (modelId) {
      const model = await this.prisma.deviceModel.findUnique({
        where: { id: modelId },
        select: { id: true },
      });
      if (!model) throw new BadRequestException(`Model ${modelId} not found`);
    }
    if (masterUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: masterUserId },
        select: { id: true },
      });
      if (!user) throw new BadRequestException(`Master ${masterUserId} not found`);
    }
  }
}
