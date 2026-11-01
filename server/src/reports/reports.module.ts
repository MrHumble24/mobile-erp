import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsDailyClosingRepository } from './reports-daily-closing.repository.js';
import { ReportsExpensesRepository } from './reports-expenses.repository.js';
import { ReportsModelPricingRepository } from './reports-model-pricing.repository.js';
import { ReportsProfitRepository } from './reports-profit.repository.js';
import { ReportsService } from './reports.service.js';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsProfitRepository,
    ReportsExpensesRepository,
    ReportsModelPricingRepository,
    ReportsDailyClosingRepository,
  ],
})
export class ReportsModule {}
