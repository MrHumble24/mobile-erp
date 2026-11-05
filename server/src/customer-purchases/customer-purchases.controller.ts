import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomerPurchasesService } from './customer-purchases.service.js';
import { CreateCustomerPurchaseDto } from './dto/create-customer-purchase.dto.js';
import { ListCustomerPurchasesQueryDto } from './dto/list-customer-purchases.query.dto.js';

@Controller('customer-purchases')
export class CustomerPurchasesController {
  constructor(private readonly purchases: CustomerPurchasesService) {}

  @Post()
  @RequirePermissions('purchase.create')
  create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateCustomerPurchaseDto,
  ) {
    return this.purchases.create(caller, dto);
  }

  @Get()
  @RequirePermissions('purchase.read')
  list(@Query() query: ListCustomerPurchasesQueryDto) {
    return this.purchases.list(query);
  }

  @Get(':id')
  @RequirePermissions('purchase.read')
  get(@Param('id') id: string) {
    return this.purchases.get(id);
  }
}
