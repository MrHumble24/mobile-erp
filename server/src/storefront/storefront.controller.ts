import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateStorefrontOrderDto } from './dto/create-order.dto.js';
import { ListStorefrontProductsQueryDto } from './dto/list-products.query.dto.js';
import { UpdateStorefrontSettingsDto } from './dto/storefront-settings.dto.js';
import { StorefrontService } from './storefront.service.js';
import type {
  StorefrontConfigView,
  StorefrontProductCard,
  StorefrontProductDetail,
  StorefrontSettingsView,
} from './types/storefront.types.js';

@Controller('storefront')
@Throttle({ default: { limit: 120, ttl: 60000 } })
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Public()
  @Get('config')
  getConfig(): Promise<StorefrontConfigView> {
    return this.storefront.getConfig();
  }

  @Public()
  @Get('products')
  getProducts(
    @Query() query: ListStorefrontProductsQueryDto,
  ): Promise<StorefrontProductCard[]> {
    return this.storefront.getProducts(query);
  }

  @Public()
  @Get('products/:modelId')
  getProduct(
    @Param('modelId', ParseUUIDPipe) modelId: string,
  ): Promise<StorefrontProductDetail> {
    return this.storefront.getProduct(modelId);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateStorefrontOrderDto): Promise<{ id: string }> {
    return this.storefront.createOrder(dto);
  }

  @RequirePermissions('settings.manage')
  @Get('settings')
  getSettings(): Promise<StorefrontSettingsView> {
    return this.storefront.getSettings();
  }

  @RequirePermissions('settings.manage')
  @Put('settings')
  updateSettings(
    @Body() dto: UpdateStorefrontSettingsDto,
  ): Promise<StorefrontSettingsView> {
    return this.storefront.updateSettings(dto);
  }
}
