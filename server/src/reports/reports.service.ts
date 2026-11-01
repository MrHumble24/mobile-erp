import { Injectable } from '@nestjs/common';
import { toNumber } from '../common/lib/to-number.js';
import {
  DailyClosingQueryDto,
  DateRangeQueryDto,
  ExpenseReportQueryDto,
  ModelPricingQueryDto,
} from './dto/reports-query.dto.js';
import { ReportsDailyClosingRepository } from './reports-daily-closing.repository.js';
import { ReportsExpensesRepository } from './reports-expenses.repository.js';
import { ReportsModelPricingRepository } from './reports-model-pricing.repository.js';
import { ReportsProfitRepository } from './reports-profit.repository.js';
import {
  DailyClosingReport,
  ExpenseReportRow,
  ModelPricingRow,
  ProfitReport,
} from './types/reports.types.js';

const DAY_MS = 86_400_000;

@Injectable()
export class ReportsService {
  constructor(
    private readonly profitRepo: ReportsProfitRepository,
    private readonly expensesRepo: ReportsExpensesRepository,
    private readonly pricingRepo: ReportsModelPricingRepository,
    private readonly closingRepo: ReportsDailyClosingRepository,
  ) {}

  async profit(query: DateRangeQueryDto): Promise<ProfitReport> {
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const [sales, retail, b2b, returns, expenses] = await Promise.all([
      this.profitRepo.salesTotals(from, to),
      this.profitRepo.channelRevenue('retail', from, to),
      this.profitRepo.channelRevenue('b2b', from, to),
      this.profitRepo.returnsRefunded(from, to),
      this.profitRepo.expensesTotal(from, to),
    ]);

    const revenue = toNumber(sales._sum.salePrice);
    const cogs = toNumber(sales._sum.landedCostSnapshot);
    const grossProfit = revenue - cogs;
    const expenseTotal = toNumber(expenses._sum.amount);
    return {
      revenue,
      cogs,
      grossProfit,
      expenses: expenseTotal,
      netOperatingIncome: grossProfit - expenseTotal,
      unitsSold: sales._count,
      byChannel: {
        retail: toNumber(retail._sum.salePrice),
        b2b: toNumber(b2b._sum.salePrice),
      },
      returnsRefunded: toNumber(returns._sum.refundAmount),
    };
  }

  expenses(query: ExpenseReportQueryDto): Promise<ExpenseReportRow[]> {
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    return query.groupBy === 'month'
      ? this.expensesRepo.byMonth(from, to)
      : this.expensesRepo.byCategory(from, to);
  }

  modelPricing(query: ModelPricingQueryDto): Promise<ModelPricingRow[]> {
    return this.pricingRepo.rollingAverages(
      query.windowDays ?? 90,
      query.modelId,
    );
  }

  async dailyClosing(query: DailyClosingQueryDto): Promise<DailyClosingReport> {
    const from = startOfDay(query.date);
    const to = new Date(from.getTime() + DAY_MS);
    const [sales, expenses, newC, settledC] = await Promise.all([
      this.closingRepo.salesForDay(from, to),
      this.closingRepo.expensesForDay(from, to),
      this.closingRepo.newConsignments(from, to),
      this.closingRepo.settledConsignments(from, to),
    ]);
    const revenue = toNumber(sales._sum.salePrice);
    return {
      date: from.toISOString().slice(0, 10),
      unitsSold: sales._count,
      revenue,
      grossProfit: revenue - toNumber(sales._sum.landedCostSnapshot),
      expenses: toNumber(expenses._sum.amount),
      newConsignments: newC,
      settledConsignments: settledC,
    };
  }
}

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

// ponytail: naive UTC day boundary; add store-timezone offset if the digest drifts.
function startOfDay(value?: string): Date {
  const base = value ? new Date(value) : new Date();
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()),
  );
}
