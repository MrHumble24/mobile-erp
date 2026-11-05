import { Module } from '@nestjs/common';
import { StoresRepository } from './stores.repository.js';
import { StoresService } from './stores.service.js';

@Module({
  providers: [StoresService, StoresRepository],
  exports: [StoresService],
})
export class StoresModule {}
