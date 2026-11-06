import { ReportsService } from './reports.service.js';
import { ReportsProfitRepository } from './reports-profit.repository.js';
import { ReportsExpensesRepository } from './reports-expenses.repository.js';
import { ReportsModelPricingRepository } from './reports-model-pricing.repository.js';
import { ReportsDailyClosingRepository } from './reports-daily-closing.repository.js';

function build() {
  const profitRepo = {
    salesTotals: jest.fn().mockResolvedValue({
      _sum: { salePrice: 1000, landedCostSnapshot: 600 },
      _count: 4,
    }),
    channelRevenue: jest.fn((channel: 'retail' | 'b2b') =>
      Promise.resolve({
        _sum: { salePrice: channel === 'retail' ? 700 : 300 },
      }),
    ),
    returnsRefunded: jest
      .fn()
      .mockResolvedValue({ _sum: { refundAmount: 50 } }),
    expensesTotal: jest.fn().mockResolvedValue({ _sum: { amount: 250 } }),
    discountsTotals: jest
      .fn()
      .mockResolvedValue({ _sum: { listPriceSnapshot: 90, salePrice: 60 } }),
    bonusByType: jest.fn().mockResolvedValue([
      { typeCode: 'EARN', _sum: { amount: 120 } },
      { typeCode: 'SPEND', _sum: { amount: -40 } },
    ]),
  };
  const pricingRepo = { rollingAverages: jest.fn().mockResolvedValue([]) };
  const closingRepo = {
    salesForDay: jest.fn().mockResolvedValue({
      _sum: { salePrice: 1200, landedCostSnapshot: 800 },
      _count: 3,
    }),
    expensesForDay: jest.fn().mockResolvedValue({ _sum: { amount: 150 } }),
    newConsignments: jest.fn().mockResolvedValue(2),
    settledConsignments: jest.fn().mockResolvedValue(1),
  };
  const storesService = {
    currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
  };
  const companyService = {
    getTimeZone: jest.fn().mockResolvedValue('Asia/Tashkent'),
  };
  const service = new ReportsService(
    profitRepo as unknown as ReportsProfitRepository,
    {} as ReportsExpensesRepository,
    pricingRepo as unknown as ReportsModelPricingRepository,
    closingRepo as unknown as ReportsDailyClosingRepository,
    storesService as unknown as any,
    companyService as unknown as any,
  );
  return {
    service,
    profitRepo,
    pricingRepo,
    closingRepo,
    storesService,
    companyService,
  };
}

describe('ReportsService.profit', () => {
  it('derives gross profit, net operating income and channel split', async () => {
    const { service } = build();
    const r = await service.profit({});
    expect(r.revenue).toBe(1000);
    expect(r.cogs).toBe(600);
    expect(r.grossProfit).toBe(400);
    expect(r.expenses).toBe(250);
    expect(r.netOperatingIncome).toBe(150);
    expect(r.unitsSold).toBe(4);
    expect(r.byChannel).toEqual({ retail: 700, b2b: 300 });
    expect(r.returnsRefunded).toBe(50);
    expect(r.discountsGiven).toBe(30);
    expect(r.bonusPointsEarned).toBe(120);
    expect(r.bonusPointsSpent).toBe(40);
  });

  it('treats null aggregate sums as zero', async () => {
    const { service, profitRepo } = build();
    profitRepo.salesTotals.mockResolvedValue({
      _sum: { salePrice: null, landedCostSnapshot: null },
      _count: 0,
    });
    const r = await service.profit({});
    expect(r.revenue).toBe(0);
    expect(r.grossProfit).toBe(0);
    expect(r.netOperatingIncome).toBe(-250);
  });
});

describe('ReportsService.modelPricing', () => {
  it('defaults the rolling window to 90 days', async () => {
    const { service, pricingRepo } = build();
    await service.modelPricing({});
    expect(pricingRepo.rollingAverages).toHaveBeenCalledWith(90, undefined);
  });

  it('passes through an explicit window and model', async () => {
    const { service, pricingRepo } = build();
    await service.modelPricing({ windowDays: 30, modelId: 'm1' });
    expect(pricingRepo.rollingAverages).toHaveBeenCalledWith(30, 'm1');
  });
});

describe('ReportsService.dailyClosing', () => {
  it('computes closing report for date in company time zone', async () => {
    const { service, closingRepo } = build();
    const result = await service.dailyClosing({ date: '2026-11-06' });
    expect(result.date).toBe('2026-11-06');
    expect(result.revenue).toBe(1200);
    expect(result.grossProfit).toBe(400);
    expect(result.expenses).toBe(150);
    expect(result.unitsSold).toBe(3);
    expect(result.newConsignments).toBe(2);
    expect(result.settledConsignments).toBe(1);

    // Verify UTC boundary passed to repository (2026-11-05T19:00:00Z for Tashkent)
    const calls = closingRepo.salesForDay.mock.calls as [
      Date,
      Date,
      string[],
    ][];
    const [fromArg, toArg] = calls[0];
    expect(fromArg.toISOString()).toBe('2026-11-05T19:00:00.000Z');
    expect(toArg.toISOString()).toBe('2026-11-06T19:00:00.000Z');
  });
});
