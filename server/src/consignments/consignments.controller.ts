import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ConsignmentsService } from './consignments.service.js';
import { CreateConsignmentDto } from './dto/create-consignment.dto.js';
import { ListConsignmentsQuery } from './dto/list-consignments.query.js';
import { ReturnConsignmentDto } from './dto/return-consignment.dto.js';
import { SettleConsignmentDto } from './dto/settle-consignment.dto.js';

@Controller('consignments')
export class ConsignmentsController {
  constructor(private readonly consignments: ConsignmentsService) {}

  @Post()
  @RequirePermissions('consignment.create')
  create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateConsignmentDto,
  ) {
    return this.consignments.create(caller, dto);
  }

  @Get()
  @RequirePermissions('consignment.read')
  list(@Query() query: ListConsignmentsQuery) {
    return this.consignments.list(query);
  }

  // Declared before ':id' so the literal path is not captured as an id.
  @Get('overdue')
  @RequirePermissions('consignment.read')
  overdue() {
    return this.consignments.overdue();
  }

  @Get('stats')
  @RequirePermissions('consignment.read')
  stats(@Query() query: ListConsignmentsQuery) {
    return this.consignments.stats(query);
  }

  @Get(':id')
  @RequirePermissions('consignment.read')
  get(@Param('id') id: string) {
    return this.consignments.get(id);
  }

  @Post(':id/settle')
  @RequirePermissions('consignment.settle')
  settle(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SettleConsignmentDto,
  ) {
    return this.consignments.settle(caller, id, dto);
  }

  @Post(':id/return')
  @RequirePermissions('consignment.settle')
  returnToStock(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReturnConsignmentDto,
  ) {
    return this.consignments.returnToStock(caller, id, dto);
  }
}
