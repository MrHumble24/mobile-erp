import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module.js';
import { StockModule } from '../stock/stock.module.js';
import { ScanController } from './scan.controller.js';
import { ScanService } from './scan.service.js';

@Module({
  imports: [DevicesModule, StockModule],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
