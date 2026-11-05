import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PartnersRepository } from './partners.repository.js';

const D = (n: number) => new Prisma.Decimal(n);

function build(accounts: Map<string, string>) {
  const prisma = {
    consignment: { findMany: jest.fn().mockResolvedValue([]) },
    partnerPayment: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'p1',
          amount: D(100),
          paidAt: new Date('2026-11-01'),
          notes: null,
        },
        {
          id: 'p2',
          amount: D(50),
          paidAt: new Date('2026-11-02'),
          notes: null,
        },
      ]),
    },
  } as unknown as PrismaService;
  const ledger = {
    partnerPaymentAccounts: jest.fn().mockResolvedValue(accounts),
  } as unknown as LedgerService;
  return new PartnersRepository(prisma, ledger);
}

describe('PartnersRepository.ledger payment accountCode', () => {
  it('tags each payment entry with its ledger account', async () => {
    const repo = build(new Map([['p1', 'CARD']]));
    const entries = await repo.ledger('partner-1');
    const byRef = new Map(entries.map((e) => [e.refId, e]));
    expect(byRef.get('p1')?.accountCode).toBe('CARD');
  });

  it('is null for a payment recorded before the ledger existed', async () => {
    const repo = build(new Map());
    const entries = await repo.ledger('partner-1');
    expect(entries.every((e) => e.accountCode === null)).toBe(true);
  });
});
