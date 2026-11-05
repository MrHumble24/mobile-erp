import { Module } from '@nestjs/common';
import { ConsignmentsModule } from '../consignments/consignments.module.js';
import { LedgerModule } from '../ledger/ledger.module.js';
import { PartnersModule } from '../partners/partners.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { StockAlertRulesModule } from '../stock-alert-rules/stock-alert-rules.module.js';
import { TelegramCron } from './telegram.cron.js';
import { TelegramListener } from './telegram.listener.js';
import { TelegramService } from './telegram.service.js';

@Module({
  imports: [
    SettingsModule,
    StockAlertRulesModule,
    ConsignmentsModule,
    PartnersModule,
    ReportsModule,
    LedgerModule,
  ],
  providers: [TelegramService, TelegramListener, TelegramCron],
})
export class TelegramModule {}
