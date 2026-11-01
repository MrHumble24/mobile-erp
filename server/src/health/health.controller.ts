import { Controller, Get, Query } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { HealthQueryDto } from './dto/health-check.dto.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(@Query() query: HealthQueryDto) {
    return this.healthService.check(query);
  }
}
