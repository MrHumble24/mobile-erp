import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from '../../sales/dto/create-sale.dto.js';
import { resolveSaleTarget } from '../../sales/lib/sale-target.js';
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
    // Offline replay: the sale already happened at the counter, so a price or
    // discount mismatch is not rejected (ADR 0034) and the shift gate is skipped
    // (ADR 0036) — the till is trusted.
    return this.sales.create(ctx.caller, dto, {
      trustClientPrice: true,
      fromSync: true,
    });
  }

  deviceId(dto: CreateSaleDto): Promise<string | null> {
    // A quantity sale has no device and never conflicts (no state lock).
    const target = resolveSaleTarget(dto);
    if (target.kind !== 'unit') return Promise.resolve(null);
    return this.repo.deviceIdByCode(target.code);
  }
}
