import { Controller, Get, Query } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { HealthQueryDto } from './dto/health-check.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AllowDuringMaintenance } from '../common/decorators/allow-during-maintenance.decorator.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @AllowDuringMaintenance()
  @Get()
  async getHealth(@Query() query: HealthQueryDto) {
    return this.healthService.check(query);
  }
}
