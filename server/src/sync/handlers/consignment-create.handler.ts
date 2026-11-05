import { Injectable } from '@nestjs/common';
import { ConsignmentsService } from '../../consignments/consignments.service.js';
import { CreateConsignmentDto } from '../../consignments/dto/create-consignment.dto.js';
import { resolveUnitCode } from '../../devices/lib/unit-code.js';
import { SyncRepository } from '../sync.repository.js';
import type { MutationContext, SyncHandler } from './sync-handler.interface.js';

@Injectable()
export class ConsignmentCreateHandler implements SyncHandler<CreateConsignmentDto> {
  readonly permission = 'consignment.create';
  readonly dtoClass = CreateConsignmentDto;

  constructor(
    private readonly consignments: ConsignmentsService,
    private readonly repo: SyncRepository,
  ) {}

  findExisting(ctx: MutationContext): Promise<unknown> {
    return this.consignments.findByClientMutationId(ctx.mutationId);
  }

  apply(ctx: MutationContext, dto: CreateConsignmentDto): Promise<unknown> {
    dto.clientMutationId = ctx.mutationId;
    dto.expectedVersion = ctx.baseVersion;
    return this.consignments.create(ctx.caller, dto);
  }

  deviceId(dto: CreateConsignmentDto): Promise<string | null> {
    return this.repo.deviceIdByCode(resolveUnitCode(dto));
  }
}
