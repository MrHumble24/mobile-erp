import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module.js';
import { SalesModule } from '../sales/sales.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { CreditsController } from './credits.controller.js';
import { CreditsReadService } from './credits-read.service.js';
import { CreditsRepository } from './credits.repository.js';
import { CreditsService } from './credits.service.js';
import { CreditsWriteRepository } from './credits.write.repository.js';

@Module({
  imports: [SalesModule, LedgerModule, SettingsModule, StoresModule],
  controllers: [CreditsController],
  providers: [
    CreditsService,
    CreditsReadService,
    CreditsRepository,
    CreditsWriteRepository,
  ],
  exports: [CreditsReadService],
})
export class CreditsModule {}
