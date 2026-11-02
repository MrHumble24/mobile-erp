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
import { CreatePartnerDto } from './dto/create-partner.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { ListPartnersQuery } from './dto/list-partners.query.js';
import { UpdatePartnerDto } from './dto/update-partner.dto.js';
import { PartnersService } from './partners.service.js';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Get()
  @RequirePermissions('partner.read')
  list(@Query() query: ListPartnersQuery) {
    return this.partners.list(query);
  }

  @Get(':id')
  @RequirePermissions('partner.read')
  get(@Param('id') id: string) {
    return this.partners.get(id);
  }

  @Get(':id/ledger')
  @RequirePermissions('partner.read')
  ledger(@Param('id') id: string) {
    return this.partners.ledger(id);
  }

  @Get(':id/aging')
  @RequirePermissions('partner.read')
  aging(@Param('id') id: string) {
    return this.partners.aging(id);
  }

  @Post()
  @RequirePermissions('partner.manage')
  create(@Body() dto: CreatePartnerDto) {
    return this.partners.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('partner.manage')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partners.update(id, dto);
  }

  @Post(':id/payments')
  @RequirePermissions('partner.payment')
  recordPayment(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.partners.recordPayment(caller, id, dto);
  }
}
