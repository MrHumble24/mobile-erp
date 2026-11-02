import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import {
  DailyClosingQueryDto,
  DateRangeQueryDto,
  ExpenseReportQueryDto,
  ModelPricingQueryDto,
  ProfitBreakdownQueryDto,
  ReturnsQueryDto,
  TrendQueryDto,
} from './dto/reports-query.dto.js';
import { ReportsAnalyticsService } from './reports-analytics.service.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@RequirePermissions('report.finance')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly analytics: ReportsAnalyticsService,
  ) {}

  @Get('profit')
  profit(@Query() query: DateRangeQueryDto) {
    return this.reports.profit(query);
  }

  @Get('trend')
  trend(@Query() query: TrendQueryDto) {
    return this.analytics.trend(query);
  }

  @Get('profit/breakdown')
  profitBreakdown(@Query() query: ProfitBreakdownQueryDto) {
    return this.analytics.profitBreakdown(query);
  }

  @Get('returns')
  returns(@Query() query: ReturnsQueryDto) {
    return this.analytics.returns(query);
  }

  @Get('expenses')
  expenses(@Query() query: ExpenseReportQueryDto) {
    return this.reports.expenses(query);
  }

  @Get('consignments')
  consignments(@Query() query: DateRangeQueryDto) {
    return this.analytics.consignments(query);
  }

  @Get('inventory')
  inventory() {
    return this.analytics.inventory();
  }

  @Get('model-pricing')
  modelPricing(@Query() query: ModelPricingQueryDto) {
    return this.reports.modelPricing(query);
  }

  @Get('daily-closing/range')
  dailyClosingRange(@Query() query: DateRangeQueryDto) {
    return this.reports.dailyClosingRange(query);
  }

  @Get('daily-closing')
  dailyClosing(@Query() query: DailyClosingQueryDto) {
    return this.reports.dailyClosing(query);
  }
}
