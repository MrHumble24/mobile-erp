import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LookupQueryDto } from './dto/lookup-query.dto.js';
import { LookupService } from './lookup.service.js';

@Controller('lookup')
export class LookupController {
  constructor(private readonly lookup: LookupService) {}

  @Get()
  @RequirePermissions('device.read')
  resolve(@Query() query: LookupQueryDto) {
    return this.lookup.lookup(query.code);
  }

  @Post('links')
  @RequirePermissions('device.update')
  learn(@Body() dto: CreateLinkDto) {
    return this.lookup.learnLink(dto.refBrand, dto.refModel, dto.modelId);
  }
}
