import { Prisma } from '../../generated/client/client.js';
import { buildRefundPostings } from './refund.js';

const D = (n: number | string) => new Prisma.Decimal(n);

describe('buildRefundPostings', () => {
  it('mirrors a split sale in proportion to its SALE rows', () => {
    const out = buildRefundPostings(250, [
      { accountCode: 'CASH', amount: D(150) },
      { accountCode: 'CARD', amount: D(100) },
    ]);
    expect(out).toEqual([
      { accountCode: 'CASH', amount: D(150) },
      { accountCode: 'CARD', amount: D(100) },
    ]);
  });

  it('refunds from CASH when the sale has no ledger rows', () => {
    expect(buildRefundPostings(200, [])).toEqual([
      { accountCode: 'CASH', amount: D(200) },
    ]);
  });

  it('posts nothing for a zero refund', () => {
    expect(
      buildRefundPostings(0, [{ accountCode: 'CASH', amount: D(10) }]),
    ).toEqual([]);
  });
});
