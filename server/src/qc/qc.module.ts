import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module.js';
import { QcController } from './qc.controller.js';
import { QcRepository } from './qc.repository.js';
import { QcService } from './qc.service.js';

@Module({
  imports: [DevicesModule],
  controllers: [QcController],
  providers: [QcService, QcRepository],
})
export class QcModule {}
