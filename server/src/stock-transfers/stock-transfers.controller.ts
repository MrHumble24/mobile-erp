import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto.js';
import { ListStockTransfersQueryDto } from './dto/list-stock-transfers-query.dto.js';
import { StockTransfersService } from './stock-transfers.service.js';

@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly transfers: StockTransfersService) {}

  @Get()
  @RequirePermissions('transfer.read')
  list(@Query() query: ListStockTransfersQueryDto) {
    return this.transfers.list(query);
  }

  @Get(':id')
  @RequirePermissions('transfer.read')
  get(@CurrentUser() caller: AuthenticatedUser, @Param('id') id: string) {
    return this.transfers.get(caller, id);
  }

  @Post()
  @RequirePermissions('transfer.create')
  create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.transfers.create(caller, dto);
  }

  @Post(':id/receive')
  @RequirePermissions('transfer.receive')
  receive(@CurrentUser() caller: AuthenticatedUser, @Param('id') id: string) {
    return this.transfers.receive(caller, id);
  }

  @Post(':id/cancel')
  @RequirePermissions('transfer.create')
  cancel(@CurrentUser() caller: AuthenticatedUser, @Param('id') id: string) {
    return this.transfers.cancel(caller, id);
  }
}
