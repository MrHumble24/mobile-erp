import { Prisma } from '../../generated/client/client.js';
import { aggregateStats, type StatsRow } from './ledger-stats.js';

/** Test row builder: numbers become the exact Decimal the aggregation reads. */
function row(
  overrides: Partial<Omit<StatsRow, 'amount'>> & { amount: number },
): StatsRow {
  const { amount, ...rest } = overrides;
  return {
    accountCode: 'CASH',
    typeCode: 'SALE',
    occurredAt: new Date('2026-11-07T10:00:00Z'),
    type: { label: `t-${rest.typeCode ?? 'SALE'}` },
    account: { label: 'Naqd' },
    amount: new Prisma.Decimal(amount),
    ...rest,
  };
}

describe('aggregateStats', () => {
  it('keeps flows and the net flow apart from OPENING rows', () => {
    const stats = aggregateStats(
      [
        row({ typeCode: 'OPENING', amount: 20000 }),
        row({ typeCode: 'SALE', amount: 1400 }),
        row({ typeCode: 'PURCHASE', amount: -1000 }),
        row({ typeCode: 'DEVICE_EXPENSE', amount: -10 }),
      ],
      true,
    );

    expect(stats.summary).toMatchObject({
      totalIn: '1400.00',
      totalOut: '1010.00',
      netFlow: '390.00',
      transactionCount: 3,
      inCount: 1,
      outCount: 2,
      opening: '20000.00',
    });
  });

  it('nets a negative OPENING snapshot, still outside the flows', () => {
    const stats = aggregateStats(
      [
        row({ typeCode: 'OPENING', amount: -500 }),
        row({ typeCode: 'WITHDRAWAL', amount: -200 }),
      ],
      true,
    );

    expect(stats.summary.opening).toBe('-500.00');
    expect(stats.summary.netFlow).toBe('-200.00');
    expect(stats.summary.transactionCount).toBe(1);
  });

  it('leaves OPENING out of the timeline and both breakdowns', () => {
    const stats = aggregateStats(
      [
        row({ typeCode: 'OPENING', amount: 20000, occurredAt: new Date('2026-11-07T10:00:00Z') }),
        row({ typeCode: 'SALE', amount: 1400, occurredAt: new Date('2026-11-07T11:00:00Z') }),
        row({ typeCode: 'DEVICE_EXPENSE', amount: -10, occurredAt: new Date('2026-11-07T09:00:00Z') }),
      ],
      true,
    );

    expect(stats.timeline).toHaveLength(1);
    expect(stats.timeline[0]).toEqual({
      date: '2026-11-07',
      inflow: 1400,
      outflow: 10,
      net: 1390,
    });

    expect(stats.byType.find((t) => t.typeCode === 'OPENING')).toBeUndefined();
    expect(stats.byAccount).toEqual([
      {
        accountCode: 'CASH',
        accountLabel: 'Naqd',
        inflow: 1400,
        outflow: 10,
        net: 1390,
      },
    ]);
  });
});
