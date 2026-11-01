import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import {
  DailyClosingQueryDto,
  DateRangeQueryDto,
  ExpenseReportQueryDto,
  ModelPricingQueryDto,
} from './dto/reports-query.dto.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@RequirePermissions('report.finance')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('profit')
  profit(@Query() query: DateRangeQueryDto) {
    return this.reports.profit(query);
  }

  @Get('expenses')
  expenses(@Query() query: ExpenseReportQueryDto) {
    return this.reports.expenses(query);
  }

  @Get('model-pricing')
  modelPricing(@Query() query: ModelPricingQueryDto) {
    return this.reports.modelPricing(query);
  }

  @Get('daily-closing')
  dailyClosing(@Query() query: DailyClosingQueryDto) {
    return this.reports.dailyClosing(query);
  }
}
