import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { SalesCreateService } from './sales-create.service.js';
import { SalesReadService } from './sales-read.service.js';
import type { CheckoutOptions } from './sales-pricing.service.js';
import type { SaleView } from './types/sale.types.js';

/**
 * Public facade for sales: reads delegate to {@link SalesReadService}, checkout
 * to {@link SalesCreateService}. The single injection point for other modules
 * (controller, customers, sync) so they never reach into the split services.
 */
@Injectable()
export class SalesService {
  constructor(
    private readonly read: SalesReadService,
    private readonly writes: SalesCreateService,
  ) {}

  create(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    options?: CheckoutOptions,
  ): Promise<SaleView> {
    return this.writes.create(caller, dto, options);
  }

  findByClientMutationId(id: string): Promise<SaleView | null> {
    return this.read.findByClientMutationId(id);
  }

  list(query: ListSalesQueryDto) {
    return this.read.list(query);
  }

  stats(query: ListSalesQueryDto) {
    return this.read.stats(query);
  }

  get(id: string): Promise<SaleView> {
    return this.read.get(id);
  }

  listByCustomer(customerId: string): Promise<SaleView[]> {
    return this.read.listByCustomer(customerId);
  }

  warrantyLookup(imei: string) {
    return this.read.warrantyLookup(imei);
  }

  receipt(id: string) {
    return this.read.receipt(id);
  }
}
