import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/client/client.js';
import { resolveSalePayments } from './payments.js';

const ACTIVE = ['CASH', 'CARD'];

describe('resolveSalePayments', () => {
  it('defaults to a single CASH payment for the whole price', () => {
    expect(resolveSalePayments(undefined, 250, ACTIVE)).toEqual([
      { accountCode: 'CASH', amount: new Prisma.Decimal(250) },
    ]);
  });

  it('accepts a split that adds up to the price', () => {
    const out = resolveSalePayments(
      [
        { accountCode: 'CASH', amount: 150 },
        { accountCode: 'CARD', amount: 100 },
      ],
      250,
      ACTIVE,
    );
    expect(out).toHaveLength(2);
  });

  it('rejects a split that does not add up to the price', () => {
    expect(() =>
      resolveSalePayments(
        [
          { accountCode: 'CASH', amount: 150 },
          { accountCode: 'CARD', amount: 50 },
        ],
        250,
        ACTIVE,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a duplicate account', () => {
    expect(() =>
      resolveSalePayments(
        [
          { accountCode: 'CASH', amount: 100 },
          { accountCode: 'CASH', amount: 150 },
        ],
        250,
        ACTIVE,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects an inactive account', () => {
    expect(() =>
      resolveSalePayments([{ accountCode: 'GOLD', amount: 250 }], 250, ACTIVE),
    ).toThrow(BadRequestException);
  });
});
