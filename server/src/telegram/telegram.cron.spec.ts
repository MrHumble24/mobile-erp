import { TelegramCron } from './telegram.cron.js';
import { getLocalHhMm } from '../common/time-zone.js';

describe('TelegramCron.closingDigest (R1)', () => {
  it('runs with no store context and two stores without throwing, building one block per store', async () => {
    const telegram = { send: jest.fn().mockResolvedValue(undefined) };
    const consignments = { overdue: jest.fn() };
    const reports = {
      dailyClosing: jest.fn().mockResolvedValue({
        date: '2026-11-06',
        unitsSold: 5,
        revenue: 1000,
        grossProfit: 300,
        expenses: 100,
      }),
    };
    const partners = {
      list: jest.fn().mockResolvedValue([{ outstanding: 500 }]),
    };
    const now = new Date();
    const currentTime = getLocalHhMm(now, 'Asia/Tashkent');

    const settings = {
      get: jest.fn().mockResolvedValue({
        closingTime: currentTime,
        digestSentOn: null,
      }),
      markDigestSent: jest.fn().mockResolvedValue({}),
    };
    const ledger = {
      digestBalances: jest.fn().mockResolvedValue({
        accounts: [],
        openingTotal: '0',
        closingTotal: '1000',
      }),
    };
    const credits = { overdue: jest.fn() };
    const stores = {
      list: jest.fn().mockResolvedValue([
        { id: 'store-1', name: 'Store 1' },
        { id: 'store-2', name: 'Store 2' },
      ]),
    };
    const company = {
      getTimeZone: jest.fn().mockResolvedValue('Asia/Tashkent'),
    };

    const cron = new TelegramCron(
      telegram as never,
      consignments as never,
      reports as never,
      partners as never,
      settings as never,
      ledger as never,
      credits as never,
      stores as never,
      company as never,
      { isActive: () => false } as never,
      {
        repairDailySummary: jest.fn().mockResolvedValue({ income: 250, profit: 80 }),
      } as never,
    );

    // Call closingDigest outside of any store context
    await cron.closingDigest();

    expect(telegram.send).toHaveBeenCalledTimes(1);
    const sentMessage = telegram.send.mock.calls[0][0];
    expect(sentMessage).toContain('Store 1');
    expect(sentMessage).toContain('Store 2');
    expect(sentMessage).toContain("Ta'mir tushumi");
    expect(sentMessage).toContain("Ta'mir foydasi");

    expect(settings.markDigestSent).toHaveBeenCalledTimes(2);
    expect(reports.dailyClosing).toHaveBeenCalledTimes(2);
  });
});
