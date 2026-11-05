import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { PartnersController } from './partners.controller.js';
import { PartnersRepository } from './partners.repository.js';
import { PartnersService } from './partners.service.js';

@Module({
  imports: [StoresModule, LedgerModule],
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepository],
  exports: [PartnersService],
})
export class PartnersModule {}
