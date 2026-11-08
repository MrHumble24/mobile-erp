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
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RepairCreatedEvent,
  RepairGivenBackEvent,
  RepairReadyEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
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
import type { RepairView } from './types/repair.types.js';

@Controller('repairs')
export class RepairsController {
  constructor(
    private readonly repairs: RepairsService,
    private readonly read: RepairsReadService,
    private readonly money: RepairsMoneyService,
    private readonly parts: RepairsPartsService,
    private readonly events: EventEmitter2,
  ) {}

  @Post()
  @RequirePermissions('repair.manage')
  async create(
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: CreateRepairDto,
  ) {
    const view = await this.repairs.create(caller, dto);
    this.events.emit(
      TelegramEvents.repairCreated,
      new RepairCreatedEvent(
        view.ticketNumber,
        view.customer.name,
        view.deviceName,
      ),
    );
    return view;
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
  async changeStatus(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    const view = await this.repairs.changeStatus(caller, id, dto);
    this.emitStatusEvent(view);
    return view;
  }

  /** Owner alerts on the two milestones a shop manager wants to hear about. */
  private emitStatusEvent(view: RepairView): void {
    if (view.statusCode === 'READY') {
      this.events.emit(
        TelegramEvents.repairReady,
        new RepairReadyEvent(view.ticketNumber, view.deviceName),
      );
    }
    if (view.statusCode === 'GIVEN_BACK') {
      this.events.emit(
        TelegramEvents.repairGivenBack,
        new RepairGivenBackEvent(
          view.ticketNumber,
          view.deviceName,
          Number(view.outstanding),
        ),
      );
    }
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
