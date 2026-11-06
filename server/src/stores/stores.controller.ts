import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { UpdateStoreDto } from './dto/update-store.dto.js';
import { StoresService } from './stores.service.js';

@Controller('stores')
@RequirePermissions('store.manage')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list(@Query('includeDeactivated') includeDeactivated?: string) {
    return this.stores.list(includeDeactivated === 'true');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.stores.get(id);
  }

  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.stores.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.stores.update(id, dto);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.stores.deactivate(id);
  }
}
