import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module.js';
import { PartnersController } from './partners.controller.js';
import { PartnersRepository } from './partners.repository.js';
import { PartnersService } from './partners.service.js';

@Module({
  imports: [StoresModule],
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepository],
  exports: [PartnersService],
})
export class PartnersModule {}
