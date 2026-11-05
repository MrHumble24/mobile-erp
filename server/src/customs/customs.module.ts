import { Module } from '@nestjs/common';
import { CustomsController } from './customs.controller.js';
import { CustomsRepository } from './customs.repository.js';
import { CustomsService } from './customs.service.js';

@Module({
  controllers: [CustomsController],
  providers: [CustomsService, CustomsRepository],
  // Exported so shipments injects CustomsService to stamp the current fee at
  // intake — never the repository.
  exports: [CustomsService],
})
export class CustomsModule {}
