import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import {
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/delivery-zone.dto.js';
import { StorefrontDeliveryZonesService } from './storefront-delivery-zones.service.js';
import type { StorefrontDeliveryZoneView } from './types/storefront.types.js';

@Controller('storefront/delivery-zones')
@RequirePermissions('settings.manage')
export class StorefrontDeliveryZonesController {
  constructor(private readonly zones: StorefrontDeliveryZonesService) {}

  @Get()
  list(): Promise<StorefrontDeliveryZoneView[]> {
    return this.zones.list();
  }

  @Post()
  create(
    @Body() dto: CreateDeliveryZoneDto,
  ): Promise<StorefrontDeliveryZoneView> {
    return this.zones.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryZoneDto,
  ): Promise<StorefrontDeliveryZoneView> {
    return this.zones.update(id, dto);
  }

  @Delete(':id')
  delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: boolean }> {
    return this.zones.delete(id);
  }
}
