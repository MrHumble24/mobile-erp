import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { ListMovementsQueryDto } from './dto/list-movements.query.dto.js';
import { ListStockQueryDto } from './dto/list-stock.query.dto.js';
import { StockService } from './stock.service.js';

@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  @RequirePermissions('device.read')
  list(
    @CurrentUser() caller: AuthenticatedUser,
    @Query() query: ListStockQueryDto,
  ) {
    return this.stock.list(caller, query);
  }

  @Get(':modelId/movements')
  @RequirePermissions('device.read')
  movements(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('modelId') modelId: string,
    @Query() query: ListMovementsQueryDto,
  ) {
    return this.stock.movements(caller, modelId, query.page, query.pageSize);
  }

  @Post('adjust')
  @RequirePermissions('stock.adjust')
  adjust(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: AdjustStockDto,
  ) {
    return this.stock.adjust(caller, dto);
  }
}
