import { Injectable } from '@nestjs/common';
import { resolveUnitCode } from '../../devices/lib/unit-code.js';
import { CreateSaleDto } from '../../sales/dto/create-sale.dto.js';
import { SalesService } from '../../sales/sales.service.js';
import { SyncRepository } from '../sync.repository.js';
import type { MutationContext, SyncHandler } from './sync-handler.interface.js';

@Injectable()
export class SaleCreateHandler implements SyncHandler<CreateSaleDto> {
  readonly permission = 'sale.create';
  readonly dtoClass = CreateSaleDto;

  constructor(
    private readonly sales: SalesService,
    private readonly repo: SyncRepository,
  ) {}

  findExisting(ctx: MutationContext): Promise<unknown> {
    return this.sales.findByClientMutationId(ctx.mutationId);
  }

  apply(ctx: MutationContext, dto: CreateSaleDto): Promise<unknown> {
    dto.clientMutationId = ctx.mutationId;
    dto.expectedVersion = ctx.baseVersion;
    return this.sales.create(ctx.caller, dto);
  }

  deviceId(dto: CreateSaleDto): Promise<string | null> {
    return this.repo.deviceIdByCode(resolveUnitCode(dto));
  }
}
