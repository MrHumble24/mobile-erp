import { Module } from '@nestjs/common';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { LookupController } from './lookup.controller.js';
import { LookupRepository } from './lookup.repository.js';
import { LookupService } from './lookup.service.js';

@Module({
  imports: [DeviceModelsModule],
  controllers: [LookupController],
  providers: [LookupService, LookupRepository],
})
export class LookupModule {}
