import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { QcService } from './qc.service.js';

@Controller('qc')
export class QcController {
  constructor(private readonly qc: QcService) {}

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
  list(@Query('deviceId') deviceId?: string) {
    return this.qc.list(deviceId);
  }

  @Get('defect-types')
  @RequirePermissions('qc.read')
  defectTypes() {
    return this.qc.listDefectTypes();
  }

  @Get('grades')
  @RequirePermissions('qc.read')
  grades() {
    return this.qc.listGrades();
  }
}
