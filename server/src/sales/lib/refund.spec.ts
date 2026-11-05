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

  it('hands a trade-in value back in cash, never more card than was paid', () => {
    // 10,000,000 sale: 4,000,000 cash + 3,000,000 card + a 3,000,000 trade-in.
    const out = buildRefundPostings(10_000_000, [
      { accountCode: 'CASH', amount: D(4_000_000) },
      { accountCode: 'CARD', amount: D(3_000_000) },
    ]);
    expect(out).toEqual([
      { accountCode: 'CASH', amount: D(7_000_000) },
      { accountCode: 'CARD', amount: D(3_000_000) },
    ]);
  });

  it('adds a cash row when a trade-in sale was paid by card only', () => {
    const out = buildRefundPostings(1000, [
      { accountCode: 'CARD', amount: D(700) },
    ]);
    expect(out).toEqual([
      { accountCode: 'CARD', amount: D(700) },
      { accountCode: 'CASH', amount: D(300) },
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
