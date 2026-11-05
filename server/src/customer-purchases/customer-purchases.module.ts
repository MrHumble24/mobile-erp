import { Module } from '@nestjs/common';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { LedgerModule } from '../ledger/ledger.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { CustomerPurchasesController } from './customer-purchases.controller.js';
import { CustomerPurchasesRepository } from './customer-purchases.repository.js';
import { CustomerPurchasesService } from './customer-purchases.service.js';
import { CustomerPurchasesWriteRepository } from './customer-purchases.write.repository.js';

@Module({
  imports: [DeviceModelsModule, LedgerModule, ShiftsModule, StoresModule],
  controllers: [CustomerPurchasesController],
  providers: [
    CustomerPurchasesService,
    CustomerPurchasesRepository,
    CustomerPurchasesWriteRepository,
  ],
  // Sales (trade-in) injects the service + write repository (ADR 0039).
  exports: [CustomerPurchasesService, CustomerPurchasesWriteRepository],
})
export class CustomerPurchasesModule {}
