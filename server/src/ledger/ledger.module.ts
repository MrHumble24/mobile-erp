import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module.js';
import { LedgerController } from './ledger.controller.js';
import { LedgerRepository } from './ledger.repository.js';
import { LedgerService } from './ledger.service.js';

@Module({
  imports: [StoresModule],
  controllers: [LedgerController],
  providers: [LedgerService, LedgerRepository],
  // Exported so 2b modules (sales, expenses, ...) inject LedgerService to post
  // rows inside their own transaction — never LedgerRepository.
  exports: [LedgerService],
})
export class LedgerModule {}
