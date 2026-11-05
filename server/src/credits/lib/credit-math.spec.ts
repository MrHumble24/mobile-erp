import { Prisma } from '../../generated/client/client.js';
import { computeCreditStanding, type InstalmentInput } from './credit-math.js';

const D = (n: number | string) => new Prisma.Decimal(n);
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = new Date('2026-06-15T10:00:00.000Z');

function plan(): InstalmentInput[] {
  return [
    { id: 'i1', dueDate: date('2026-03-01'), amount: D(100) },
    { id: 'i2', dueDate: date('2026-04-01'), amount: D(100) },
    { id: 'i3', dueDate: date('2026-05-01'), amount: D(100) },
  ];
}

describe('computeCreditStanding', () => {
  it('allocates payments to instalments in due-date order', () => {
    const s = computeCreditStanding({
      salePrices: [D(300)],
      paymentAmounts: [D(150)], // covers i1 fully, i2 half
      instalments: plan(),
      now: NOW,
    });
    expect(s.agreedTotal.toFixed(2)).toBe('300.00');
    expect(s.paid.toFixed(2)).toBe('150.00');
    expect(s.outstanding.toFixed(2)).toBe('150.00');
    expect(s.settled).toBe(false);
    expect(s.instalments[0].paid.toFixed(2)).toBe('100.00');
    expect(s.instalments[1].paid.toFixed(2)).toBe('50.00'); // partly paid
    expect(s.instalments[2].paid.toFixed(2)).toBe('0.00');
  });

  it('flags a past-due, not-fully-covered instalment as overdue', () => {
    const s = computeCreditStanding({
      salePrices: [D(300)],
      paymentAmounts: [D(150)],
      instalments: plan(),
      now: NOW, // 2026-06-15: i1, i2, i3 all past
    });
    expect(s.instalments[0].overdue).toBe(false); // fully paid
    expect(s.instalments[1].overdue).toBe(true); // half paid, past due
    expect(s.instalments[2].overdue).toBe(true); // unpaid, past due
    expect(s.overdueAmount.toFixed(2)).toBe('150.00'); // 50 + 100
  });

  it('does not flag a future instalment as overdue', () => {
    const s = computeCreditStanding({
      salePrices: [D(300)],
      paymentAmounts: [D(0)],
      instalments: [{ id: 'f', dueDate: date('2026-12-01'), amount: D(300) }],
      now: NOW,
    });
    expect(s.instalments[0].overdue).toBe(false);
    expect(s.overdueAmount.toFixed(2)).toBe('0.00');
  });

  it('is settled when fully paid', () => {
    const s = computeCreditStanding({
      salePrices: [D(300)],
      paymentAmounts: [D(100), D(100), D(100)],
      instalments: plan(),
      now: NOW,
    });
    expect(s.outstanding.toFixed(2)).toBe('0.00');
    expect(s.settled).toBe(true);
    expect(s.overdueAmount.toFixed(2)).toBe('0.00');
    expect(s.overpaid.toFixed(2)).toBe('0.00');
  });

  it('lowers the agreed total when a sale is returned (excluded from salePrices)', () => {
    // Two sales (200 + 100); the 100 one was returned, so only 200 remains.
    const s = computeCreditStanding({
      salePrices: [D(200)],
      paymentAmounts: [D(150)],
      instalments: plan(),
      now: NOW,
    });
    expect(s.agreedTotal.toFixed(2)).toBe('200.00');
    expect(s.outstanding.toFixed(2)).toBe('50.00');
  });

  it('reports the overpaid amount after a return once paid exceeds the new total', () => {
    // Agreed dropped to 200 but the customer already paid 250.
    const s = computeCreditStanding({
      salePrices: [D(200)],
      paymentAmounts: [D(250)],
      instalments: plan(),
      now: NOW,
    });
    expect(s.outstanding.toFixed(2)).toBe('-50.00');
    expect(s.overpaid.toFixed(2)).toBe('50.00');
    expect(s.settled).toBe(true);
  });
});
