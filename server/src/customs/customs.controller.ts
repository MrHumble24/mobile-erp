import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomsService } from './customs.service.js';
import { CreatePriceListDto } from './dto/create-price-list.dto.js';

/** Customs price-list versions and coverage reads (ADR 0027). */
@Controller('customs/price-lists')
export class CustomsController {
  constructor(private readonly customs: CustomsService) {}

  @Post()
  @RequirePermissions('customs.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePriceListDto,
  ) {
    return this.customs.createPriceList(dto, user.id);
  }

  @Get()
  @RequirePermissions('customs.read')
  list() {
    return this.customs.listVersions();
  }

  @Get('current')
  @RequirePermissions('customs.read')
  current() {
    return this.customs.currentList();
  }

  @Get('unmatched-models')
  @RequirePermissions('customs.read')
  unmatchedModels() {
    return this.customs.unmatchedModels();
  }

  @Get('fees/:customsCode/history')
  @RequirePermissions('customs.read')
  feeHistory(@Param('customsCode') customsCode: string) {
    return this.customs.feeHistory(customsCode);
  }
}
