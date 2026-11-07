import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LookupQueryDto } from './dto/lookup-query.dto.js';
import { LookupSearchQueryDto } from './dto/lookup-search-query.dto.js';
import { LookupService } from './lookup.service.js';

@Controller('lookup')
export class LookupController {
  constructor(private readonly lookup: LookupService) {}

  @Get('search')
  @RequirePermissions('device.read')
  search(@Query() query: LookupSearchQueryDto) {
    return this.lookup.search(query.q);
  }

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
