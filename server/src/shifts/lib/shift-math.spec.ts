import { Prisma } from '../../generated/client/client.js';
import { summariseShift, type ShiftRow } from './shift-math.js';

const D = (v: number | string) => new Prisma.Decimal(v);

function row(typeCode: string, accountCode: string, amount: number): ShiftRow {
  return { typeCode, accountCode, amount: D(amount) };
}

describe('summariseShift', () => {
  it('expected cash = opening + cash in − cash out; card is ignored for cash', () => {
    const rows = [
      row('SALE', 'CASH', 300_000), // cash in
      row('SALE', 'CARD', 500_000), // card: not part of expected cash
      row('EXPENSE', 'CASH', -50_000), // cash out
      row('CREDIT_PAYMENT', 'CASH', 100_000), // cash in
    ];
    const s = summariseShift(D(500_000), null, rows);
    // 500,000 + 300,000 − 50,000 + 100,000 = 850,000
    expect(s.expectedCash).toBe('850000.00');
    expect(s.cardTotal).toBe('500000.00');
    expect(s.countedCash).toBeNull();
    expect(s.difference).toBeNull();
    expect(s.differenceAmount).toBeNull();
  });

  it('difference is positive when more cash was counted than expected', () => {
    const rows = [row('SALE', 'CASH', 200_000)];
    const s = summariseShift(D(500_000), D(710_000), rows);
    expect(s.expectedCash).toBe('700000.00');
    expect(s.difference).toBe('10000.00'); // 710,000 − 700,000
    expect(s.differenceAmount).toBe(10_000);
  });

  it('difference is negative when less cash was counted than expected', () => {
    const rows = [row('SALE', 'CASH', 200_000)];
    const s = summariseShift(D(500_000), D(680_000), rows);
    expect(s.expectedCash).toBe('700000.00');
    expect(s.difference).toBe('-20000.00'); // 680,000 − 700,000
    expect(s.differenceAmount).toBe(-20_000);
  });

  it('difference is exactly zero when the count matches', () => {
    const rows = [row('SALE', 'CASH', 200_000)];
    const s = summariseShift(D(500_000), D(700_000), rows);
    expect(s.difference).toBe('0.00');
    expect(s.differenceAmount).toBe(0);
  });

  it('never counts a SHIFT_DIFFERENCE row as a movement or in expected cash', () => {
    const rows = [
      row('SALE', 'CASH', 200_000),
      row('SHIFT_DIFFERENCE', 'CASH', -20_000), // last shift's correction, same drawer
    ];
    const s = summariseShift(D(500_000), null, rows);
    expect(s.expectedCash).toBe('700000.00'); // 500k + 200k, correction excluded
    expect(
      s.byType.find((t) => t.typeCode === 'SHIFT_DIFFERENCE'),
    ).toBeUndefined();
    const cash = s.byAccount.find((a) => a.accountCode === 'CASH');
    expect(cash?.net).toBe('200000.00');
  });

  it('groups by account (in/out/net) and by type with per-account counts', () => {
    const rows = [
      row('SALE', 'CASH', 300_000),
      row('SALE', 'CARD', 500_000),
      row('SALE', 'CARD', 400_000),
      row('REFUND', 'CASH', -100_000),
    ];
    const s = summariseShift(D(0), null, rows);
    const cash = s.byAccount.find((a) => a.accountCode === 'CASH');
    expect(cash).toEqual({
      accountCode: 'CASH',
      in: '300000.00',
      out: '100000.00',
      net: '200000.00',
    });
    const sale = s.byType.find((t) => t.typeCode === 'SALE');
    expect(sale?.count).toBe(3); // 3 SALE rows
    const saleCard = sale?.byAccount.find((a) => a.accountCode === 'CARD');
    expect(saleCard?.count).toBe(2); // "2 on card"
    expect(saleCard?.total).toBe('900000.00');
  });
});
