import { buildConsignmentWhere } from './consignment.where.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');

describe('buildConsignmentWhere', () => {
  it('is empty for no filters', () => {
    expect(buildConsignmentWhere({}, NOW)).toEqual({});
  });

  it('overdue overrides any status with OUT past due', () => {
    const where = buildConsignmentWhere(
      { statusCode: 'SETTLED', overdue: true },
      NOW,
    );
    expect(where.statusCode).toBe('OUT');
    expect(where.dueDate).toEqual({ lt: NOW });
  });

  it('applies a plain status when not overdue', () => {
    expect(buildConsignmentWhere({ statusCode: 'RETURNED' }, NOW)).toEqual({
      statusCode: 'RETURNED',
    });
  });

  it('searches IMEI or partner shop name, case-insensitive', () => {
    const where = buildConsignmentWhere({ search: ' 123 ' }, NOW);
    expect(where.OR).toEqual([
      { device: { imei: { contains: '123', mode: 'insensitive' } } },
      { partner: { shopName: { contains: '123', mode: 'insensitive' } } },
    ]);
  });

  it('bounds consignedAt by from/to', () => {
    const where = buildConsignmentWhere(
      { from: '2026-01-01', to: '2026-02-01' },
      NOW,
    );
    expect(where.consignedAt).toEqual({
      gte: new Date('2026-01-01'),
      lte: new Date('2026-02-01'),
    });
  });

  it('ignores blank search', () => {
    expect(buildConsignmentWhere({ search: '   ' }, NOW)).toEqual({});
  });
});
