import { Injectable, NotFoundException } from '@nestjs/common';
import { RepairIdempotency } from '../../repairs/repair-idempotency.service.js';
import { RepairsMoneyService } from '../../repairs/repairs-money.service.js';
import { RepairsPartsService } from '../../repairs/repairs-parts.service.js';
import { RepairsService } from '../../repairs/repairs.service.js';
import type { MutationContext, SyncHandler } from './sync-handler.interface.js';
import {
  RepairCreateSyncDto,
  RepairMoneySyncDto,
  RepairPartAddSyncDto,
  RepairPartRemoveSyncDto,
  RepairStatusSyncDto,
  RepairUpdateSyncDto,
} from './repair-sync.dto.js';

/** Common replay detection: the idempotency key is the queue entry id. */
abstract class RepairHandlerBase<D extends object> implements SyncHandler<D> {
  abstract readonly permission: string;
  abstract readonly dtoClass: new () => D;

  constructor(protected readonly idem: RepairIdempotency) {}

  findExisting(ctx: MutationContext): Promise<unknown> {
    return this.idem.findRepairIdByKey(ctx.mutationId);
  }

  deviceId(): Promise<string | null> {
    // Repairs are not device-version-locked; a conflict is rejected, not logged
    // against an inventory unit.
    return Promise.resolve(null);
  }

  abstract apply(ctx: MutationContext, dto: D): Promise<unknown>;
}

@Injectable()
export class RepairCreateHandler extends RepairHandlerBase<RepairCreateSyncDto> {
  readonly permission = 'repair.manage';
  readonly dtoClass = RepairCreateSyncDto;

  constructor(idem: RepairIdempotency, private readonly repairs: RepairsService) {
    super(idem);
  }

  apply(ctx: MutationContext, dto: RepairCreateSyncDto) {
    dto.clientMutationId = ctx.mutationId;
    return this.repairs.create(ctx.caller, dto);
  }
}

@Injectable()
export class RepairUpdateHandler extends RepairHandlerBase<RepairUpdateSyncDto> {
  readonly permission = 'repair.manage';
  readonly dtoClass = RepairUpdateSyncDto;

  constructor(idem: RepairIdempotency, private readonly repairs: RepairsService) {
    super(idem);
  }

  apply(ctx: MutationContext, dto: RepairUpdateSyncDto) {
    dto.clientMutationId = ctx.mutationId;
    return this.repairs.update(ctx.caller, dto.repairId, dto);
  }
}

@Injectable()
export class RepairStatusHandler extends RepairHandlerBase<RepairStatusSyncDto> {
  readonly permission = 'repair.manage';
  readonly dtoClass = RepairStatusSyncDto;

  constructor(idem: RepairIdempotency, private readonly repairs: RepairsService) {
    super(idem);
  }

  apply(ctx: MutationContext, dto: RepairStatusSyncDto) {
    dto.clientMutationId = ctx.mutationId;
    return this.repairs.changeStatus(ctx.caller, dto.repairId, dto);
  }
}

@Injectable()
export class RepairPaymentHandler extends RepairHandlerBase<RepairMoneySyncDto> {
  readonly permission = 'repair.payment';
  readonly dtoClass = RepairMoneySyncDto;

  constructor(idem: RepairIdempotency, private readonly money: RepairsMoneyService) {
    super(idem);
  }

  apply(ctx: MutationContext, dto: RepairMoneySyncDto) {
    return this.applyMoney(ctx, dto, (m, c, id, d) => m.addPayment(c, id, d));
  }

  protected async applyMoney(
    ctx: MutationContext,
    dto: RepairMoneySyncDto,
    run: (
      money: RepairsMoneyService,
      caller: MutationContext['caller'],
      id: string,
      body: RepairMoneySyncDto,
    ) => Promise<unknown>,
  ) {
    dto.clientMutationId = ctx.mutationId;
    return run(this.money, ctx.caller, dto.repairId, dto);
  }
}

@Injectable()
export class RepairRefundHandler extends RepairPaymentHandler {
  apply(ctx: MutationContext, dto: RepairMoneySyncDto) {
    return this.applyMoney(ctx, dto, (m, c, id, d) => m.refund(c, id, d));
  }
}

@Injectable()
export class RepairOutsideHandler extends RepairPaymentHandler {
  apply(ctx: MutationContext, dto: RepairMoneySyncDto) {
    return this.applyMoney(ctx, dto, (m, c, id, d) => m.outsidePayment(c, id, d));
  }
}

@Injectable()
export class RepairPartAddHandler extends RepairHandlerBase<RepairPartAddSyncDto> {
  readonly permission = 'repair.manage';
  readonly dtoClass = RepairPartAddSyncDto;

  constructor(idem: RepairIdempotency, private readonly parts: RepairsPartsService) {
    super(idem);
  }

  apply(ctx: MutationContext, dto: RepairPartAddSyncDto) {
    dto.clientMutationId = ctx.mutationId;
    return this.parts.addPart(ctx.caller, dto.repairId, dto);
  }
}

@Injectable()
export class RepairPartRemoveHandler extends RepairHandlerBase<RepairPartRemoveSyncDto> {
  readonly permission = 'repair.manage';
  readonly dtoClass = RepairPartRemoveSyncDto;

  constructor(idem: RepairIdempotency, private readonly parts: RepairsPartsService) {
    super(idem);
  }

  async apply(ctx: MutationContext, dto: RepairPartRemoveSyncDto) {
    try {
      return await this.parts.removePart(ctx.caller, dto.repairId, dto.partId);
    } catch (error) {
      // A replayed removal of an already-removed part is a no-op, not a failure.
      if (error instanceof NotFoundException) return { removed: false };
      throw error;
    }
  }
}
