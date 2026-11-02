import { Prisma } from '../../generated/client/client.js';
import { buildLedger } from './ledger.js';

const D = (n: number) => new Prisma.Decimal(n);

describe('buildLedger', () => {
  it('orders events by time and tracks a running balance', () => {
    const entries = buildLedger(
      [
        {
          id: 'c1',
          agreedPrice: D(500),
          consignedAt: new Date('2026-01-01'),
          statusCode: 'OUT',
          resolvedAt: null,
          notes: null,
        },
      ],
      [
        {
          id: 'p1',
          amount: D(200),
          paidAt: new Date('2026-01-05'),
          notes: null,
        },
      ],
    );
    expect(entries.map((e) => e.runningBalance.toNumber())).toEqual([500, 300]);
    expect(entries[1].kind).toBe('payment');
  });

  it('reverses a RETURNED consignment at resolvedAt', () => {
    const entries = buildLedger(
      [
        {
          id: 'c1',
          agreedPrice: D(500),
          consignedAt: new Date('2026-01-01'),
          statusCode: 'RETURNED',
          resolvedAt: new Date('2026-01-10'),
          notes: null,
        },
      ],
      [],
    );
    expect(entries).toHaveLength(2);
    expect(entries[1].change.toNumber()).toBe(-500);
    expect(entries[1].runningBalance.toNumber()).toBe(0);
  });
});
