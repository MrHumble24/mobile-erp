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
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { ListInspectionsDto } from './dto/list-inspections.dto.js';
import { CreateLookupDto, UpdateLookupDto } from './dto/lookup.dto.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';
import { QcLookupsService } from './qc-lookups.service.js';
import { QcStatsService } from './qc-stats.service.js';
import { QcService } from './qc.service.js';

@Controller('qc')
export class QcController {
  constructor(
    private readonly qc: QcService,
    private readonly lookups: QcLookupsService,
    private readonly stats: QcStatsService,
  ) {}

  @Post('inspections')
  @RequirePermissions('qc.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInspectionDto,
  ) {
    return this.qc.createInspection(dto, user.id);
  }

  @Get('inspections')
  @RequirePermissions('qc.read')
  list(@Query() dto: ListInspectionsDto) {
    return this.qc.list(dto);
  }

  @Get('stats')
  @RequirePermissions('qc.read')
  statsSummary(@Query() dto: StatsQueryDto) {
    return this.stats.get(dto);
  }

  @Get('defect-types')
  @RequirePermissions('qc.read')
  defectTypes(@Query('includeInactive') includeInactive?: string) {
    return this.lookups.listDefectTypes(includeInactive === 'true');
  }

  @Post('defect-types')
  @RequirePermissions('settings.manage')
  createDefectType(@Body() dto: CreateLookupDto) {
    return this.lookups.createDefectType(dto);
  }

  @Patch('defect-types/:code')
  @RequirePermissions('settings.manage')
  updateDefectType(@Param('code') code: string, @Body() dto: UpdateLookupDto) {
    return this.lookups.updateDefectType(code, dto);
  }

  @Get('grades')
  @RequirePermissions('qc.read')
  grades(@Query('includeInactive') includeInactive?: string) {
    return this.lookups.listGrades(includeInactive === 'true');
  }

  @Post('grades')
  @RequirePermissions('settings.manage')
  createGrade(@Body() dto: CreateLookupDto) {
    return this.lookups.createGrade(dto);
  }

  @Patch('grades/:code')
  @RequirePermissions('settings.manage')
  updateGrade(@Param('code') code: string, @Body() dto: UpdateLookupDto) {
    return this.lookups.updateGrade(code, dto);
  }
}
