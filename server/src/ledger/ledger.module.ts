import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module.js';
import { LedgerController } from './ledger.controller.js';
import { LedgerRepairReadService } from './ledger-repair-read.service.js';
import { LedgerRepository } from './ledger.repository.js';
import { LedgerService } from './ledger.service.js';

@Module({
  imports: [StoresModule],
  controllers: [LedgerController],
  providers: [LedgerService, LedgerRepairReadService, LedgerRepository],
  // Exported so 2b modules (sales, expenses, ...) inject LedgerService to post
  // rows inside their own transaction — never LedgerRepository.
  // LedgerRepairReadService is the repairs module's derived outside-cost reads.
  exports: [LedgerService, LedgerRepairReadService],
})
export class LedgerModule {}
