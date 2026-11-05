import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { ShiftsController } from './shifts.controller.js';
import { ShiftsReadService } from './shifts-read.service.js';
import { ShiftsRepository } from './shifts.repository.js';
import { ShiftsService } from './shifts.service.js';

@Module({
  imports: [LedgerModule, SettingsModule, StoresModule],
  controllers: [ShiftsController],
  providers: [ShiftsService, ShiftsReadService, ShiftsRepository],
  // Exported so sales and credits inject ShiftsService.assertCanSell as the
  // "selling needs an open shift" gate (ADR 0036).
  exports: [ShiftsService],
})
export class ShiftsModule {}
