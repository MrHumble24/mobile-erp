import { Injectable } from '@nestjs/common';
import { ConsignmentsService } from '../../consignments/consignments.service.js';
import { SettleMutationDto } from '../dto/settle-mutation.dto.js';
import { SyncRepository } from '../sync.repository.js';
import type { MutationContext, SyncHandler } from './sync-handler.interface.js';

@Injectable()
export class ConsignmentSettleHandler implements SyncHandler<SettleMutationDto> {
  readonly permission = 'consignment.settle';
  readonly dtoClass = SettleMutationDto;

  constructor(
    private readonly consignments: ConsignmentsService,
    private readonly repo: SyncRepository,
  ) {}

  /** No idempotency key: a replay re-hits settle and surfaces as a conflict. */
  findExisting(): Promise<unknown> {
    return Promise.resolve(null);
  }

  apply(ctx: MutationContext, dto: SettleMutationDto): Promise<unknown> {
    dto.expectedVersion = ctx.baseVersion;
    return this.consignments.settle(ctx.caller, dto.consignmentId, dto);
  }

  deviceId(dto: SettleMutationDto): Promise<string | null> {
    return this.repo.deviceIdByConsignment(dto.consignmentId);
  }
}
