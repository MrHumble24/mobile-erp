import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreditsReadService } from './credits-read.service.js';
import { CreditsService } from './credits.service.js';
import { CreateCreditDto } from './dto/create-credit.dto.js';
import { CreditPaymentDto } from './dto/credit-payment.dto.js';
import { ListCreditsQueryDto } from './dto/list-credits.query.dto.js';

@Controller('credits')
export class CreditsController {
  constructor(
    private readonly credits: CreditsService,
    private readonly read: CreditsReadService,
  ) {}

  @Post()
  @RequirePermissions('sale.credit')
  create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateCreditDto,
  ) {
    return this.credits.create(caller, dto);
  }

  @Get()
  @RequirePermissions('sale.read')
  list(@Query() query: ListCreditsQueryDto) {
    return this.read.list(query);
  }

  @Get('report')
  @RequirePermissions('report.finance')
  report() {
    return this.read.report();
  }

  @Get(':id')
  @RequirePermissions('sale.read')
  get(@Param('id') id: string) {
    return this.read.get(id);
  }

  @Get(':id/contract')
  @RequirePermissions('sale.read')
  contract(@Param('id') id: string) {
    return this.read.contract(id);
  }

  @Post(':id/payments')
  @RequirePermissions('sale.create')
  addPayment(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreditPaymentDto,
  ) {
    return this.credits.addPayment(caller, id, dto);
  }

  @Post(':id/refund')
  @RequirePermissions('sale.return')
  refund(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreditPaymentDto,
  ) {
    return this.credits.refundOverpayment(caller, id, dto);
  }
}
