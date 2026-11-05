import { Prisma } from '../../generated/client/client.js';
import {
  ANY_STORAGE,
  productKey,
  resolveAllLevels,
  resolveListPrice,
  type PriceInputs,
} from './price-resolution.js';

const D = (v: number) => new Prisma.Decimal(v);

function inputs(
  own: Record<string, number>,
  product: Record<string, number>,
): PriceInputs {
  return {
    own: new Map(Object.entries(own).map(([k, v]) => [k, D(v)])),
    product: new Map(Object.entries(product).map(([k, v]) => [k, D(v)])),
  };
}

describe('resolveListPrice — resolution order (ADR 0034)', () => {
  it('uses the unit own price when set, winning over product prices', () => {
    const p = inputs(
      { RETAIL: 1200 },
      {
        [productKey('256GB', 'RETAIL')]: 1100,
        [productKey('', 'RETAIL')]: 1000,
      },
    );
    expect(resolveListPrice('RETAIL', '256GB', p)!.toFixed(2)).toBe('1200.00');
  });

  it('falls back to the product price for the storage', () => {
    const p = inputs(
      {},
      {
        [productKey('256GB', 'WHOLESALE')]: 1100,
        [productKey('', 'WHOLESALE')]: 1000,
      },
    );
    expect(resolveListPrice('WHOLESALE', '256GB', p)!.toFixed(2)).toBe(
      '1100.00',
    );
  });

  it('falls back to the any-storage product price when no storage match', () => {
    const p = inputs({}, { [productKey('', 'PARTNER')]: 950 });
    expect(resolveListPrice('PARTNER', '512GB', p)!.toFixed(2)).toBe('950.00');
  });

  it('returns null when nothing is set at that level', () => {
    const p = inputs(
      { RETAIL: 1200 },
      { [productKey('256GB', 'RETAIL')]: 1100 },
    );
    expect(resolveListPrice('WHOLESALE', '256GB', p)).toBeNull();
  });

  it('a quantity product (empty own, ANY_STORAGE) reads the any-storage price', () => {
    const p = inputs({}, { [productKey(ANY_STORAGE, 'RETAIL')]: 25 });
    expect(resolveListPrice('RETAIL', ANY_STORAGE, p)!.toFixed(2)).toBe(
      '25.00',
    );
  });

  it('resolveAllLevels maps every level to a 2-dp string or null', () => {
    const p = inputs({ RETAIL: 1200 }, { [productKey('', 'WHOLESALE')]: 1100 });
    expect(
      resolveAllLevels(['RETAIL', 'WHOLESALE', 'PARTNER'], '256GB', p),
    ).toEqual({
      RETAIL: '1200.00',
      WHOLESALE: '1100.00',
      PARTNER: null,
    });
  });
});
