import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AddPartDto } from './dto/add-part.dto.js';
import { ChangeStatusDto } from './dto/change-status.dto.js';
import { CreateRepairDto } from './dto/create-repair.dto.js';
import { ListRepairsQueryDto } from './dto/list-repairs.query.dto.js';
import { RepairMoneyDto } from './dto/repair-money.dto.js';
import { RepairReportQueryDto } from './dto/report.query.dto.js';
import { UpdateRepairDto } from './dto/update-repair.dto.js';
import { RepairsMoneyService } from './repairs-money.service.js';
import { RepairsPartsService } from './repairs-parts.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsService } from './repairs.service.js';

@Controller('repairs')
export class RepairsController {
  constructor(
    private readonly repairs: RepairsService,
    private readonly read: RepairsReadService,
    private readonly money: RepairsMoneyService,
    private readonly parts: RepairsPartsService,
  ) {}

  @Post()
  @RequirePermissions('repair.manage')
  create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateRepairDto,
  ) {
    return this.repairs.create(caller, dto);
  }

  @Get()
  @RequirePermissions('repair.read')
  list(@Query() query: ListRepairsQueryDto) {
    return this.read.list(query);
  }

  @Get('report')
  @RequirePermissions('repair.read')
  report(
    @CurrentUser() caller: AuthenticatedUser,
    @Query() query: RepairReportQueryDto,
  ) {
    return this.read.report(caller, query);
  }

  @Get(':id')
  @RequirePermissions('repair.read')
  get(@CurrentUser() caller: AuthenticatedUser, @Param('id') id: string) {
    return this.read.get(caller, id);
  }

  @Patch(':id')
  @RequirePermissions('repair.manage')
  update(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRepairDto,
  ) {
    return this.repairs.update(caller, id, dto);
  }

  @Post(':id/status')
  @RequirePermissions('repair.manage')
  changeStatus(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.repairs.changeStatus(caller, id, dto);
  }

  @Post(':id/parts')
  @RequirePermissions('repair.manage')
  addPart(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddPartDto,
  ) {
    return this.parts.addPart(caller, id, dto);
  }

  @Delete(':id/parts/:partId')
  @RequirePermissions('repair.manage')
  removePart(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Param('partId') partId: string,
  ) {
    return this.parts.removePart(caller, id, partId);
  }

  @Post(':id/payments')
  @RequirePermissions('repair.payment')
  addPayment(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RepairMoneyDto,
  ) {
    return this.money.addPayment(caller, id, dto);
  }

  @Post(':id/outside-payment')
  @RequirePermissions('repair.payment')
  outsidePayment(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RepairMoneyDto,
  ) {
    return this.money.outsidePayment(caller, id, dto);
  }

  @Post(':id/refund')
  @RequirePermissions('repair.payment')
  refund(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RepairMoneyDto,
  ) {
    return this.money.refund(caller, id, dto);
  }
}
