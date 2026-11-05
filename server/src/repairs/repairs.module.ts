import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { StockModule } from '../stock/stock.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { RepairsController } from './repairs.controller.js';
import { RepairsMoneyService } from './repairs-money.service.js';
import { RepairsPartsService } from './repairs-parts.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsRepository } from './repairs.repository.js';
import { RepairsService } from './repairs.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';

@Module({
  imports: [
    LedgerModule,
    SettingsModule,
    ShiftsModule,
    StockModule,
    StoresModule,
  ],
  controllers: [RepairsController],
  providers: [
    RepairsService,
    RepairsReadService,
    RepairsMoneyService,
    RepairsPartsService,
    RepairsRepository,
    RepairsWriteRepository,
  ],
})
export class RepairsModule {}
