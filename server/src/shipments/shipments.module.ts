import { Module } from '@nestjs/common';
import { CustomsModule } from '../customs/customs.module.js';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { LedgerModule } from '../ledger/ledger.module.js';
import { StockModule } from '../stock/stock.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { SuppliersModule } from '../suppliers/suppliers.module.js';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
import { ShipmentsQuantityRepository } from './shipments-quantity.repository.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { ShipmentsService } from './shipments.service.js';

@Module({
  imports: [
    SuppliersModule,
    DeviceModelsModule,
    StoresModule,
    LedgerModule,
    StockModule,
    CustomsModule,
  ],
  controllers: [ShipmentsController],
  providers: [
    ShipmentsService,
    ShipmentsRepository,
    ShipmentsIntakeRepository,
    ShipmentsQuantityRepository,
  ],
})
export class ShipmentsModule {}
