import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { ReturnSaleDto } from './dto/return-sale.dto.js';
import { SalesService } from './sales.service.js';

@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Post()
  @RequirePermissions('sale.create')
  create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.sales.create(caller, dto);
  }

  @Get()
  @RequirePermissions('sale.read')
  list(@Query() query: ListSalesQueryDto) {
    return this.sales.list(query);
  }

  @Get('warranty/:imei')
  @RequirePermissions('sale.read')
  warranty(@Param('imei') imei: string) {
    return this.sales.warrantyLookup(imei);
  }

  @Get(':id')
  @RequirePermissions('sale.read')
  get(@Param('id') id: string) {
    return this.sales.get(id);
  }

  @Get(':id/receipt')
  @RequirePermissions('sale.read')
  receipt(@Param('id') id: string) {
    return this.sales.receipt(id);
  }

  @Post(':id/return')
  @RequirePermissions('sale.return')
  return_(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReturnSaleDto,
  ) {
    return this.sales.processReturn(caller, id, dto);
  }
}
