import { Injectable } from '@nestjs/common';
import { CompanyService } from '../company/company.service.js';
import { getLocalDateString, startOfLocalDay } from '../common/time-zone.js';
import { toNumber } from '../common/lib/to-number.js';
import { StoresService } from '../stores/stores.service.js';
import {
  DailyClosingQueryDto,
  DateRangeQueryDto,
  ExpenseReportQueryDto,
  ModelPricingQueryDto,
} from './dto/reports-query.dto.js';
import { withExpenseShare } from './lib/share.js';
import { bucketStarts } from './lib/trend.js';
import { ReportsDailyClosingRepository } from './reports-daily-closing.repository.js';
import { ReportsExpensesRepository } from './reports-expenses.repository.js';
import { ReportsModelPricingRepository } from './reports-model-pricing.repository.js';
import { ReportsProfitRepository } from './reports-profit.repository.js';
import {
  DailyClosingReport,
  ExpenseReportRowWithShare,
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
    private readonly stores: StoresService,
    private readonly company: CompanyService,
  ) {}

  async profit(query: DateRangeQueryDto): Promise<ProfitReport> {
    const storeIds = await this.stores.currentStoreIds();
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const [sales, retail, b2b, returns, expenses, discounts, bonus] =
      await Promise.all([
        this.profitRepo.salesTotals(from, to, storeIds),
        this.profitRepo.channelRevenue('retail', from, to, storeIds),
        this.profitRepo.channelRevenue('b2b', from, to, storeIds),
        this.profitRepo.returnsRefunded(from, to, storeIds),
        this.profitRepo.expensesTotal(from, to, storeIds),
        this.profitRepo.discountsTotals(from, to, storeIds),
        this.profitRepo.bonusByType(from, to, storeIds),
      ]);

    const revenue = toNumber(sales._sum.salePrice);
    const cogs = toNumber(sales._sum.landedCostSnapshot);
    const grossProfit = revenue - cogs;
    const expenseTotal = toNumber(expenses._sum.amount);
    const earnRow = bonus.find((b) => b.typeCode === 'EARN');
    const spendRow = bonus.find((b) => b.typeCode === 'SPEND');
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
      discountsGiven:
        toNumber(discounts._sum.listPriceSnapshot) -
        toNumber(discounts._sum.salePrice),
      bonusPointsEarned: toNumber(earnRow?._sum.amount),
      bonusPointsSpent: -toNumber(spendRow?._sum.amount),
    };
  }

  async expenses(
    query: ExpenseReportQueryDto,
  ): Promise<ExpenseReportRowWithShare[]> {
    const storeIds = await this.stores.currentStoreIds();
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const rows =
      query.groupBy === 'month'
        ? await this.expensesRepo.byMonth(from, to, query.categoryId, storeIds)
        : query.groupBy === 'day'
          ? await this.expensesRepo.byDay(from, to, query.categoryId, storeIds)
          : await this.expensesRepo.byCategory(
              from,
              to,
              query.categoryId,
              storeIds,
            );
    return withExpenseShare(rows);
  }

  modelPricing(query: ModelPricingQueryDto): Promise<ModelPricingRow[]> {
    return this.pricingRepo.rollingAverages(
      query.windowDays ?? 90,
      query.modelId,
    );
  }

  async dailyClosing(query: DailyClosingQueryDto): Promise<DailyClosingReport> {
    const storeIds = await this.stores.currentStoreIds();
    const timeZone = await this.company.getTimeZone();
    const from = startOfLocalDay(query.date, timeZone);
    const to = new Date(from.getTime() + DAY_MS);
    const [sales, expenses, newC, settledC] = await Promise.all([
      this.closingRepo.salesForDay(from, to, storeIds),
      this.closingRepo.expensesForDay(from, to, storeIds),
      this.closingRepo.newConsignments(from, to, storeIds),
      this.closingRepo.settledConsignments(from, to, storeIds),
    ]);
    const revenue = toNumber(sales._sum.salePrice);
    return {
      date: getLocalDateString(from, timeZone),
      unitsSold: sales._count,
      revenue,
      grossProfit: revenue - toNumber(sales._sum.landedCostSnapshot),
      expenses: toNumber(expenses._sum.amount),
      newConsignments: newC,
      settledConsignments: settledC,
    };
  }

  async dailyClosingRange(
    query: DateRangeQueryDto,
  ): Promise<DailyClosingReport[]> {
    const storeIds = await this.stores.currentStoreIds();
    const { from, to } = rangeOrDefault(query);
    const rows = await this.closingRepo.rangeByDay(from, to, storeIds);
    const byDay = new Map(
      rows.map((r) => [new Date(r.bucket).toISOString().slice(0, 10), r]),
    );
    return bucketStarts(from, to, 'day').map((date) => {
      const r = byDay.get(date);
      return {
        date,
        unitsSold: r?.unitsSold ?? 0,
        revenue: r?.revenue ?? 0,
        grossProfit: (r?.revenue ?? 0) - (r?.cogs ?? 0),
        expenses: r?.expenses ?? 0,
        newConsignments: r?.newConsignments ?? 0,
        settledConsignments: r?.settledConsignments ?? 0,
      };
    });
  }
}

/** Range with a 30-day fallback window when either bound is missing. */
export function rangeOrDefault(
  query: DateRangeQueryDto,
  days = 30,
): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - days * DAY_MS);
  return { from, to };
}

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}
