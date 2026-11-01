import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller.js';
import { PartnersRepository } from './partners.repository.js';
import { PartnersService } from './partners.service.js';

@Module({
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepository],
  exports: [PartnersService],
})
export class PartnersModule {}
