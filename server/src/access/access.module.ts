import { Module } from '@nestjs/common';
import { AccessController } from './access.controller.js';
import { AccessRepository } from './access.repository.js';
import { AccessService } from './access.service.js';

@Module({
  controllers: [AccessController],
  providers: [AccessService, AccessRepository],
  exports: [AccessService],
})
export class AccessModule {}
