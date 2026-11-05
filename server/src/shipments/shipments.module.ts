import { Module } from '@nestjs/common';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { SuppliersModule } from '../suppliers/suppliers.module.js';
import { ShipmentsController } from './shipments.controller.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { ShipmentsService } from './shipments.service.js';

@Module({
  imports: [SuppliersModule, DeviceModelsModule, StoresModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsRepository],
})
export class ShipmentsModule {}
