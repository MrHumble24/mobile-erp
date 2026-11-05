import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { BonusService } from './bonus.service.js';
import { AdjustBonusDto } from './dto/adjust-bonus.dto.js';

/** A customer's loyalty points: balance, history, and the owner's corrections. */
@Controller('customers/:customerId/bonus')
export class BonusController {
  constructor(private readonly bonus: BonusService) {}

  @Get()
  @RequirePermissions('customer.read')
  view(@Param('customerId') customerId: string) {
    return this.bonus.view(customerId);
  }

  @Post('adjustments')
  @RequirePermissions('bonus.adjust')
  adjust(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('customerId') customerId: string,
    @Body() dto: AdjustBonusDto,
  ) {
    return this.bonus.adjust(caller, customerId, dto);
  }
}
