import { Module } from '@nestjs/common';
import { DeviceModelsController } from './device-models.controller.js';
import { DeviceModelsRepository } from './device-models.repository.js';
import { DeviceModelsService } from './device-models.service.js';

@Module({
  controllers: [DeviceModelsController],
  providers: [DeviceModelsService, DeviceModelsRepository],
  exports: [DeviceModelsService],
})
export class DeviceModelsModule {}
