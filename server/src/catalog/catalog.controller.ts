import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CatalogService } from './catalog.service.js';
import { CatalogQueryDto } from './dto/catalog-query.dto.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @RequirePermissions('device.read')
  list(@Query() query: CatalogQueryDto) {
    return this.catalog.list(query);
  }

  @Get(':modelId/units')
  @RequirePermissions('device.read')
  units(@Param('modelId') modelId: string) {
    return this.catalog.units(modelId);
  }
}
