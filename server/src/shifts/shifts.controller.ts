import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CloseShiftDto } from './dto/close-shift.dto.js';
import { ForceCloseShiftDto } from './dto/force-close-shift.dto.js';
import { ListShiftsQueryDto } from './dto/list-shifts.query.dto.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import { ShiftsReadService } from './shifts-read.service.js';
import { ShiftsService } from './shifts.service.js';

@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly read: ShiftsReadService,
  ) {}

  @Get('current')
  @RequirePermissions('sale.create')
  current(@CurrentUser() caller: AuthenticatedUser) {
    return this.read.current(caller);
  }

  @Post('open')
  @RequirePermissions('sale.create')
  open(@CurrentUser() caller: AuthenticatedUser, @Body() dto: OpenShiftDto) {
    return this.shifts.open(caller, dto);
  }

  @Post('close')
  @RequirePermissions('sale.create')
  close(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CloseShiftDto) {
    return this.shifts.close(caller, dto);
  }

  @Get()
  @RequirePermissions('sale.read')
  list(
    @CurrentUser() caller: AuthenticatedUser,
    @Query() query: ListShiftsQueryDto,
  ) {
    return this.read.list(caller, query);
  }

  @Get(':id/report')
  @RequirePermissions('sale.read')
  report(@CurrentUser() caller: AuthenticatedUser, @Param('id') id: string) {
    return this.read.report(caller, id);
  }

  @Post(':id/force-close')
  @RequirePermissions('shift.manage')
  forceClose(
    @CurrentUser() caller: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ForceCloseShiftDto,
  ) {
    return this.shifts.forceClose(caller, id, dto);
  }
}
