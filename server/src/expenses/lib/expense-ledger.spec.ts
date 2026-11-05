import { Prisma } from '../../generated/client/client.js';
import {
  createPostings,
  deletePostings,
  updatePostings,
} from './expense-ledger.js';

const D = (n: number | string) => new Prisma.Decimal(n);

describe('createPostings', () => {
  it('posts the full amount out of the chosen account', () => {
    expect(createPostings(500, 'CARD')).toEqual([
      { accountCode: 'CARD', amount: D('-500') },
    ]);
  });
  it('posts nothing for a zero amount', () => {
    expect(createPostings(0, 'CASH')).toEqual([]);
  });
});

describe('updatePostings', () => {
  it('posts only the signed difference when the account is unchanged', () => {
    expect(
      updatePostings({
        oldAmount: D(500),
        newAmount: D(800),
        currentAccount: 'CASH',
      }),
    ).toEqual([{ accountCode: 'CASH', amount: D('-300') }]);
  });

  it('reverses the old account and posts the new on an account move', () => {
    expect(
      updatePostings({
        oldAmount: D(500),
        newAmount: D(500),
        currentAccount: 'CASH',
        newAccountCode: 'CARD',
      }),
    ).toEqual([
      { accountCode: 'CASH', amount: D(500) },
      { accountCode: 'CARD', amount: D('-500') },
    ]);
  });

  it('posts the difference on CASH for a pre-ledger expense, ignoring account moves', () => {
    expect(
      updatePostings({
        oldAmount: D(500),
        newAmount: D(650),
        currentAccount: null,
        newAccountCode: 'CARD',
      }),
    ).toEqual([{ accountCode: 'CASH', amount: D('-150') }]);
  });

  it('posts nothing when neither amount nor account change', () => {
    expect(
      updatePostings({
        oldAmount: D(500),
        newAmount: D(500),
        currentAccount: 'CASH',
      }),
    ).toEqual([]);
  });
});

describe('deletePostings', () => {
  it('reverses the whole amount back onto its account', () => {
    expect(deletePostings(D(500), 'CARD')).toEqual([
      { accountCode: 'CARD', amount: D(500) },
    ]);
  });
  it('posts nothing for a pre-ledger expense', () => {
    expect(deletePostings(D(500), null)).toEqual([]);
  });
});
