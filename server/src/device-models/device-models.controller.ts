import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { DeviceModelsService } from './device-models.service.js';
import { CreateDeviceModelDto } from './dto/create-device-model.dto.js';
import { UpdateDeviceModelDto } from './dto/update-device-model.dto.js';

@Controller('device-models')
export class DeviceModelsController {
  constructor(private readonly models: DeviceModelsService) {}

  @Get()
  @RequirePermissions('device.read')
  list() {
    return this.models.list();
  }

  @Get(':id')
  @RequirePermissions('device.read')
  get(@Param('id') id: string) {
    return this.models.get(id);
  }

  @Get(':id/attributes')
  @RequirePermissions('device.read')
  getAttributes(@Param('id') id: string) {
    return this.models.getAttributes(id);
  }

  @Post()
  @RequirePermissions('device.update')
  create(@Body() dto: CreateDeviceModelDto) {
    return this.models.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('device.update')
  update(@Param('id') id: string, @Body() dto: UpdateDeviceModelDto) {
    return this.models.update(id, dto);
  }
}
