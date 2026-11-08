import * as messages from './messages.js';
import { TelegramListener } from './telegram.listener.js';
import {
  RepairCreatedEvent,
  RepairGivenBackEvent,
  RepairReadyEvent,
} from './events/telegram-events.js';

describe('repair Telegram messages', () => {
  it('names the ticket, customer and device on creation', () => {
    const text = messages.repairCreated({
      ticketNumber: 7,
      customerName: 'Mustafo',
      deviceName: 'iPhone 12',
    });
    expect(text).toContain('#7');
    expect(text).toContain('Mustafo');
    expect(text).toContain('iPhone 12');
  });

  it('tells the owner to notify the customer when ready', () => {
    const text = messages.repairReady({ ticketNumber: 7, deviceName: 'iPhone 12' });
    expect(text).toContain('#7');
    expect(text).toContain('Tayyor');
  });

  it('includes the outstanding balance on an owed hand-over only', () => {
    const owed = messages.repairGivenBack({
      ticketNumber: 7,
      deviceName: 'iPhone 12',
      amountOwed: 50_000,
    });
    expect(owed).toContain('50');
    const settled = messages.repairGivenBack({
      ticketNumber: 7,
      deviceName: 'iPhone 12',
      amountOwed: 0,
    });
    expect(settled).not.toContain('Qolgan qarz');
  });

  it('adds the repair income/profit lines to a store digest block', () => {
    const text = messages.dailyDigest({
      date: '2026-11-08',
      outstanding: 0,
      stores: [
        {
          storeName: 'Main store',
          unitsSold: 0,
          revenue: 0,
          netProfit: 0,
          expenses: 0,
          repairIncome: 250,
          repairProfit: 80,
          balances: { accounts: [], openingTotal: '0', closingTotal: '0' },
        },
      ],
    });
    expect(text).toContain("Ta'mir tushumi");
    expect(text).toContain("Ta'mir foydasi");
  });
});

describe('TelegramListener repair events', () => {
  const telegram = { send: jest.fn().mockResolvedValue(undefined) };
  const listener = new TelegramListener(
    telegram as never,
    { get: jest.fn() } as never,
    { lowStock: jest.fn() } as never,
  );

  beforeEach(() => telegram.send.mockClear());

  it('sends an owner alert for each repair milestone', async () => {
    await listener.onRepairCreated(
      new RepairCreatedEvent(7, 'Mustafo', 'iPhone 12'),
    );
    await listener.onRepairReady(new RepairReadyEvent(7, 'iPhone 12'));
    await listener.onRepairGivenBack(
      new RepairGivenBackEvent(7, 'iPhone 12', 0),
    );
    expect(telegram.send).toHaveBeenCalledTimes(3);
  });

  it('swallows a send failure instead of breaking the HTTP response', async () => {
    telegram.send.mockRejectedValueOnce(new Error('telegram down'));
    await expect(
      listener.onRepairReady(new RepairReadyEvent(8, 'iPhone 12')),
    ).resolves.toBeUndefined();
  });
});
