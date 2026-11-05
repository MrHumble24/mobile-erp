import { Module } from '@nestjs/common';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { LedgerModule } from '../ledger/ledger.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { DevicesController } from './devices.controller.js';
import { DevicesExpenseRepository } from './devices-expense.repository.js';
import { DevicesQueryRepository } from './devices-query.repository.js';
import { DevicesStatusRepository } from './devices-status.repository.js';
import { DevicesService } from './devices.service.js';

@Module({
  imports: [DeviceModelsModule, LedgerModule, PricingModule],
  controllers: [DevicesController],
  providers: [
    DevicesService,
    DevicesQueryRepository,
    DevicesStatusRepository,
    DevicesExpenseRepository,
  ],
  exports: [DevicesService],
})
export class DevicesModule {}
