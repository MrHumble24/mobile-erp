import { Prisma } from '../../generated/client/client.js';
import { currentAccount, foldSourceNets } from './source-nets.js';

const D = (n: number | string) => new Prisma.Decimal(n);

describe('foldSourceNets', () => {
  it('groups per source id into per-account nets', () => {
    const map = foldSourceNets('saleId', [
      { saleId: 's1', accountCode: 'CASH', _sum: { amount: D(60) } },
      { saleId: 's1', accountCode: 'CARD', _sum: { amount: D(40) } },
      { saleId: 's2', accountCode: 'CASH', _sum: { amount: D(10) } },
    ] as never);
    expect(map.get('s1')).toEqual([
      { accountCode: 'CASH', amount: D(60) },
      { accountCode: 'CARD', amount: D(40) },
    ]);
    expect(map.get('s2')).toEqual([{ accountCode: 'CASH', amount: D(10) }]);
  });
});

describe('currentAccount', () => {
  it('picks the only account with a nonzero net', () => {
    expect(
      currentAccount([
        { accountCode: 'CASH', amount: D(0) },
        { accountCode: 'CARD', amount: D('-50') },
      ]),
    ).toBe('CARD');
  });

  it('returns null when every net is zero (reversed) or absent', () => {
    expect(currentAccount([{ accountCode: 'CASH', amount: D(0) }])).toBeNull();
    expect(currentAccount(undefined)).toBeNull();
  });
});
