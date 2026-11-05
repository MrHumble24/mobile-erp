import { Controller, Get, Param } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { ScanService } from './scan.service.js';

@Controller('scan')
export class ScanController {
  constructor(private readonly scan: ScanService) {}

  @Get(':code')
  @RequirePermissions('device.read')
  resolve(@Param('code') code: string) {
    return this.scan.resolve(code);
  }
}
