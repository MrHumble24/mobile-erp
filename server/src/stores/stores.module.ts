import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller.js';
import { StoresRepository } from './stores.repository.js';
import { StoresService } from './stores.service.js';

@Module({
  controllers: [StoresController],
  providers: [StoresService, StoresRepository],
  exports: [StoresService, StoresRepository],
})
export class StoresModule {}
