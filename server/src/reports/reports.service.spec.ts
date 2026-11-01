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
  };
  const pricingRepo = { rollingAverages: jest.fn().mockResolvedValue([]) };
  const service = new ReportsService(
    profitRepo as unknown as ReportsProfitRepository,
    {} as ReportsExpensesRepository,
    pricingRepo as unknown as ReportsModelPricingRepository,
    {} as ReportsDailyClosingRepository,
  );
  return { service, profitRepo, pricingRepo };
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
