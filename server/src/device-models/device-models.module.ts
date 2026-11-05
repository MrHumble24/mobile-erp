import { Module } from '@nestjs/common';
import { ProductCategoriesModule } from '../product-categories/product-categories.module.js';
import { DeviceModelsController } from './device-models.controller.js';
import { DeviceModelsRepository } from './device-models.repository.js';
import { DeviceModelsService } from './device-models.service.js';

@Module({
  imports: [ProductCategoriesModule],
  controllers: [DeviceModelsController],
  providers: [DeviceModelsService, DeviceModelsRepository],
  exports: [DeviceModelsService],
})
export class DeviceModelsModule {}
