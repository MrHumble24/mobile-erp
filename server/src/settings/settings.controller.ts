import { Body, Controller, Get, Put } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Any authenticated user: the client needs defaultWarrantyDays / closingTime. */
  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  @RequirePermissions('settings.manage')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
