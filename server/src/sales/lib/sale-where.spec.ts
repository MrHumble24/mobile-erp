import type { SaleFilters } from '../types/sale.types.js';
import { buildSaleWhere } from './sale-where.js';

const base: SaleFilters = { page: 1, pageSize: 50 };

describe('buildSaleWhere', () => {
  it('maps channel to the consignment presence', () => {
    expect(buildSaleWhere({ ...base, channel: 'retail' }).consignmentId).toBe(
      null,
    );
    expect(buildSaleWhere({ ...base, channel: 'b2b' }).consignmentId).toEqual({
      not: null,
    });
    expect(buildSaleWhere(base).consignmentId).toBeUndefined();
  });

  it('searches unit codes, quantity product fields and customer name/phone', () => {
    const where = buildSaleWhere({ ...base, search: ' 359 ' });
    expect(where.OR).toEqual([
      { device: { imei: { contains: '359' } } },
      { device: { imei2: { contains: '359' } } },
      { device: { serialNumber: { contains: '359', mode: 'insensitive' } } },
      { model: { name: { contains: '359', mode: 'insensitive' } } },
      { model: { barcode: { contains: '359', mode: 'insensitive' } } },
      { model: { modelCode: { contains: '359', mode: 'insensitive' } } },
      { customer: { name: { contains: '359', mode: 'insensitive' } } },
      { customer: { phone: { contains: '359', mode: 'insensitive' } } },
    ]);
  });

  it('ignores blank search', () => {
    expect(buildSaleWhere({ ...base, search: '   ' }).OR).toBeUndefined();
  });

  it('filters returned vs not returned', () => {
    expect(buildSaleWhere({ ...base, returned: 'true' }).return).toEqual({
      isNot: null,
    });
    expect(buildSaleWhere({ ...base, returned: 'false' }).return).toEqual({
      is: null,
    });
  });

  it('active warranty excludes returned units; expired does not', () => {
    const active = buildSaleWhere({ ...base, warranty: 'active' });
    expect(active.return).toEqual({ is: null });
    expect(
      (active.warranty as { endsAt: { gt: Date } }).endsAt.gt,
    ).toBeInstanceOf(Date);

    const expired = buildSaleWhere({ ...base, warranty: 'expired' });
    expect(expired.return).toBeUndefined();
    expect(
      (expired.warranty as { endsAt: { lte: Date } }).endsAt.lte,
    ).toBeInstanceOf(Date);
  });
});
