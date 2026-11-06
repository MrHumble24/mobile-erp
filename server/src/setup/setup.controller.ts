import { Controller, Get, Post, Body } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { SetupService } from './setup.service.js';
import { SetupDto } from './dto/setup.dto.js';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  @Public()
  getStatus() {
    return this.setupService.getStatus();
  }

  @Post()
  @Public()
  performSetup(@Body() dto: SetupDto) {
    return this.setupService.setup(dto);
  }
}
