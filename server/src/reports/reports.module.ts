import { Module } from '@nestjs/common';
import { PartnersModule } from '../partners/partners.module.js';
import { StockModule } from '../stock/stock.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { ReportsAnalyticsService } from './reports-analytics.service.js';
import { ReportsBreakdownRepository } from './reports-breakdown.repository.js';
import { ReportsConsignmentsRepository } from './reports-consignments.repository.js';
import { ReportsController } from './reports.controller.js';
import { ReportsDailyClosingRepository } from './reports-daily-closing.repository.js';
import { ReportsExpensesRepository } from './reports-expenses.repository.js';
import { ReportsInventoryRepository } from './reports-inventory.repository.js';
import { ReportsModelPricingRepository } from './reports-model-pricing.repository.js';
import { ReportsProfitRepository } from './reports-profit.repository.js';
import { ReportsReturnsRepository } from './reports-returns.repository.js';
import { ReportsService } from './reports.service.js';
import { ReportsTrendRepository } from './reports-trend.repository.js';

@Module({
  imports: [PartnersModule, StockModule, StoresModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsAnalyticsService,
    ReportsProfitRepository,
    ReportsExpensesRepository,
    ReportsModelPricingRepository,
    ReportsDailyClosingRepository,
    ReportsTrendRepository,
    ReportsBreakdownRepository,
    ReportsReturnsRepository,
    ReportsConsignmentsRepository,
    ReportsInventoryRepository,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
