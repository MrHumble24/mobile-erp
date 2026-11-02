import { Injectable } from '@nestjs/common';
import { ConsignmentsService } from '../../consignments/consignments.service.js';
import { ReturnMutationDto } from '../dto/return-mutation.dto.js';
import { SyncRepository } from '../sync.repository.js';
import type { MutationContext, SyncHandler } from './sync-handler.interface.js';

@Injectable()
export class ConsignmentReturnHandler implements SyncHandler<ReturnMutationDto> {
  readonly permission = 'consignment.settle';
  readonly dtoClass = ReturnMutationDto;

  constructor(
    private readonly consignments: ConsignmentsService,
    private readonly repo: SyncRepository,
  ) {}

  findExisting(): Promise<unknown> {
    return Promise.resolve(null);
  }

  apply(ctx: MutationContext, dto: ReturnMutationDto): Promise<unknown> {
    dto.expectedVersion = ctx.baseVersion;
    return this.consignments.returnToStock(ctx.caller, dto.consignmentId, dto);
  }

  deviceId(dto: ReturnMutationDto): Promise<string | null> {
    return this.repo.deviceIdByConsignment(dto.consignmentId);
  }
}
