import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { RegisterDevicesDto } from './dto/register-devices.dto.js';
import { RegisterItemsDto } from './dto/register-items.dto.js';
import { UpdateShipmentDto } from './dto/update-shipment.dto.js';
import { ShipmentsService } from './shipments.service.js';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get()
  @RequirePermissions('shipment.read')
  list() {
    return this.shipments.list();
  }

  @Get(':id')
  @RequirePermissions('shipment.read')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.shipments.get(user, id);
  }

  @Post()
  @RequirePermissions('shipment.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.shipments.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('shipment.manage')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipments.update(id, dto);
  }

  @Post(':id/devices')
  @RequirePermissions('device.create')
  addDevices(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RegisterDevicesDto,
  ) {
    return this.shipments.addDevices(id, dto, user);
  }

  @Post(':id/items')
  @RequirePermissions('device.create')
  addItems(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RegisterItemsDto,
  ) {
    return this.shipments.addItems(id, dto, user);
  }
}
