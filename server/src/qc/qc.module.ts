import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { QcController } from './qc.controller.js';
import { QcLookupsRepository } from './qc-lookups.repository.js';
import { QcLookupsService } from './qc-lookups.service.js';
import { QcStatsRepository } from './qc-stats.repository.js';
import { QcStatsService } from './qc-stats.service.js';
import { QcRepository } from './qc.repository.js';
import { QcService } from './qc.service.js';

@Module({
  imports: [DevicesModule, StoresModule],
  controllers: [QcController],
  providers: [
    QcService,
    QcRepository,
    QcLookupsService,
    QcLookupsRepository,
    QcStatsService,
    QcStatsRepository,
  ],
})
export class QcModule {}
