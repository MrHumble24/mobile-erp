import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller.js';
import { DevicesQueryRepository } from './devices-query.repository.js';
import { DevicesStatusRepository } from './devices-status.repository.js';
import { DevicesService } from './devices.service.js';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DevicesQueryRepository, DevicesStatusRepository],
  exports: [DevicesService],
})
export class DevicesModule {}
