import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { StoresService } from '../stores/stores.service.js';
import { HandOverStorefrontOrderDto } from './dto/hand-over-order.dto.js';
import { HoldStorefrontOrderDto } from './dto/hold-order.dto.js';
import { ListStorefrontOrdersQueryDto } from './dto/list-orders.query.dto.js';
import { UpdateStorefrontOrderStatusDto } from './dto/update-order-status.dto.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import type {
  StorefrontOrderDetail,
  StorefrontOrderListItem,
} from './types/storefront.types.js';

@Controller('storefront-orders')
export class StorefrontOrdersController {
  constructor(
    private readonly orders: StorefrontOrdersService,
    private readonly stores: StoresService,
  ) {}

  @RequirePermissions('order.read')
  @Get()
  async list(@Query() query: ListStorefrontOrdersQueryDto): Promise<{
    items: StorefrontOrderListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const storeId = await this.stores.currentStoreId();
    return this.orders.list(storeId, query);
  }

  @RequirePermissions('order.read')
  @Get('stats')
  async stats(): Promise<{ new: number }> {
    const storeId = await this.stores.currentStoreId();
    return this.orders.stats(storeId);
  }

  @RequirePermissions('order.read')
  @Get(':id')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StorefrontOrderDetail> {
    const storeId = await this.stores.currentStoreId();
    return this.orders.get(storeId, id);
  }

  @RequirePermissions('order.manage')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStorefrontOrderStatusDto,
  ): Promise<StorefrontOrderDetail> {
    const storeId = await this.stores.currentStoreId();
    return this.orders.updateStatus(storeId, id, user.id, dto);
  }

  @RequirePermissions('order.manage')
  @Post(':id/hold')
  async hold(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: HoldStorefrontOrderDto,
  ): Promise<StorefrontOrderDetail> {
    const storeId = await this.stores.currentStoreId();
    return this.orders.hold(storeId, id, user.id, dto);
  }

  @RequirePermissions('order.manage')
  @Post(':id/hand-over')
  async handOver(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: HandOverStorefrontOrderDto,
  ): Promise<StorefrontOrderDetail> {
    const storeId = await this.stores.currentStoreId();
    return this.orders.handOver(storeId, id, user, dto);
  }
}
