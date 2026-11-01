import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { DevicesService } from './devices.service.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { ListDevicesDto } from './dto/list-devices.dto.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @RequirePermissions('device.read')
  list(@Query() dto: ListDevicesDto) {
    return this.devices.list(dto);
  }

  @Get('by-imei/:imei')
  @RequirePermissions('device.read')
  getByImei(@Param('imei') imei: string) {
    return this.devices.getByImei(imei);
  }

  @Get(':id')
  @RequirePermissions('device.read')
  get(@Param('id') id: string) {
    return this.devices.get(id);
  }

  @Get(':id/history')
  @RequirePermissions('device.read')
  history(@Param('id') id: string) {
    return this.devices.getHistory(id);
  }

  @Patch(':id')
  @RequirePermissions('device.update')
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.devices.updateDetails(id, dto);
  }

  @Post(':id/status')
  @RequirePermissions('device.status.change')
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.devices.changeStatus(
      id,
      dto.toStatusCode,
      user.id,
      dto.reason,
      dto.expectedVersion,
    );
  }
}
