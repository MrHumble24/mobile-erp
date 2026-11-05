import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { CreditsService } from './credits.service.js';
import { CreateCreditDto } from './dto/create-credit.dto.js';

const D = (n: number | string) => new Prisma.Decimal(n);
const caller = { id: 'u1', email: 'o@x', permissions: new Set<string>() };

/** A due date safely in the future so the past-date guard never fires. */
const future = () => new Date(Date.now() + 90 * 86400_000).toISOString();

function build(
  overrides: {
    enabled?: boolean;
    phone?: string | null;
    ownLimit?: Prisma.Decimal | null;
    defaultLimit?: Prisma.Decimal | null;
    prior?: Prisma.Decimal;
    lineTotals?: Prisma.Decimal[];
    byClientKey?: { id: string } | null;
  } = {},
) {
  const settings = {
    get: jest.fn().mockResolvedValue({
      customerCreditEnabled: overrides.enabled ?? true,
      defaultCreditLimit: overrides.defaultLimit ?? null,
    }),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const ledger = {
    activeAccountCodes: jest.fn().mockResolvedValue(['CASH', 'CARD']),
    post: jest.fn().mockResolvedValue(undefined),
  };
  const salesCredit = { checkoutLine: jest.fn() };
  for (const t of overrides.lineTotals ?? [D(300)]) {
    salesCredit.checkoutLine.mockResolvedValueOnce({
      saleId: 's',
      salePrice: t,
    });
  }
  const repo = {
    findRawByClientKey: jest
      .fn()
      .mockResolvedValue(overrides.byClientKey ?? null),
    customerForCredit: jest.fn().mockResolvedValue(
      overrides.phone === undefined
        ? {
            id: 'c1',
            phone: '+998901112233',
            creditLimit: overrides.ownLimit ?? null,
          }
        : {
            id: 'c1',
            phone: overrides.phone,
            creditLimit: overrides.ownLimit ?? null,
          },
    ),
    customerOutstanding: jest.fn().mockResolvedValue(overrides.prior ?? D(0)),
  };
  const writes = {
    transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
    createCredit: jest.fn().mockResolvedValue('credit-1'),
    createInstalments: jest.fn().mockResolvedValue(undefined),
    createPayment: jest.fn().mockResolvedValue('pay-1'),
  };
  const read = {
    get: jest.fn().mockResolvedValue({ id: 'credit-1' }),
    standing: jest.fn(),
  };
  const shifts = { assertCanSell: jest.fn(() => Promise.resolve()) };
  const service = new CreditsService(
    settings as never,
    stores as never,
    ledger as never,
    salesCredit as never,
    shifts as never,
    repo as never,
    writes as never,
    read as never,
  );
  return { service, settings, ledger, salesCredit, shifts, repo, writes, read };
}

function dto(over: Partial<CreateCreditDto> = {}): CreateCreditDto {
  return Object.assign(new CreateCreditDto(), {
    customerId: 'c1',
    lines: [{ imei: '111111111111111', salePrice: 300 }],
    payments: [{ accountCode: 'CASH', amount: 100 }],
    instalments: [
      { dueDate: future(), amount: 100 },
      { dueDate: future(), amount: 100 },
    ],
    ...over,
  });
}

describe('CreditsService.create', () => {
  it('rejects when customer credit is disabled', async () => {
    const { service } = build({ enabled: false });
    await expect(service.create(caller, dto())).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a customer with no phone number', async () => {
    const { service } = build({ phone: null });
    await expect(service.create(caller, dto())).rejects.toThrow(/phone/);
  });

  it('rejects an instalment due in the past', async () => {
    const { service } = build();
    const past = new Date(Date.now() - 86400_000).toISOString();
    await expect(
      service.create(
        caller,
        dto({ instalments: [{ dueDate: past, amount: 300 }] }),
      ),
    ).rejects.toThrow(/past/);
  });

  it('rejects when the plan does not add up to the cart total', async () => {
    const { service } = build({ lineTotals: [D(500)] }); // cart 500, plan 300
    await expect(service.create(caller, dto())).rejects.toThrow(/cart total/);
  });

  it('rejects when the new debt would exceed the limit', async () => {
    const { service } = build({ ownLimit: D(150) }); // unpaid 200 > 150
    await expect(service.create(caller, dto())).rejects.toThrow(/limit/);
  });

  it('uses the customer own limit over the settings default', async () => {
    // Default is huge but the customer's own limit is small → rejected.
    const { service } = build({ ownLimit: D(150), defaultLimit: D(1_000_000) });
    await expect(service.create(caller, dto())).rejects.toThrow(/limit/);
  });

  it('writes nothing when a line fails (error propagates, no payment posted)', async () => {
    const { service, salesCredit, writes, ledger } = build();
    salesCredit.checkoutLine.mockReset();
    salesCredit.checkoutLine
      .mockResolvedValueOnce({ saleId: 's1', salePrice: D(150) })
      .mockRejectedValueOnce(new Error('out of stock'));
    await expect(
      service.create(
        caller,
        dto({
          lines: [
            { imei: '111111111111111', salePrice: 150 },
            { imei: '222222222222222', salePrice: 150 },
          ],
        }),
      ),
    ).rejects.toThrow('out of stock');
    expect(writes.createPayment).not.toHaveBeenCalled();
    expect(ledger.post).not.toHaveBeenCalled();
  });

  it('replays idempotently on a known client key without re-creating', async () => {
    const { service, writes } = build({ byClientKey: { id: 'credit-1' } });
    await service.create(caller, dto({ clientKey: 'k-1' }));
    expect(writes.transaction).not.toHaveBeenCalled();
  });

  it('posts one CREDIT_PAYMENT per down-payment line and never a SALE row', async () => {
    const { service, ledger } = build({ lineTotals: [D(300)] });
    await service.create(
      caller,
      dto({
        payments: [
          { accountCode: 'CASH', amount: 60 },
          { accountCode: 'CARD', amount: 40 },
        ],
      }),
    );
    expect(ledger.post).toHaveBeenCalledTimes(2);
    for (const call of ledger.post.mock.calls) {
      expect(call[0].typeCode).toBe('CREDIT_PAYMENT');
    }
  });
});

describe('CreditsService later payments', () => {
  it('rejects a payment above the outstanding amount', async () => {
    const { service, read } = build();
    read.standing.mockResolvedValue({
      standing: { outstanding: D(50), overpaid: D(0) },
    });
    await expect(
      service.addPayment(caller, 'credit-1', {
        amount: 80,
        accountCode: 'CASH',
      }),
    ).rejects.toThrow(/exceeds the outstanding/);
  });

  it('caps an overpayment refund at the overpaid amount', async () => {
    const { service, read, ledger } = build();
    read.standing.mockResolvedValue({
      standing: { outstanding: D(-30), overpaid: D(30) },
    });
    await service.refundOverpayment(caller, 'credit-1', {
      amount: 100,
      accountCode: 'CASH',
    });
    // The single CREDIT_PAYMENT row is negative and capped at -30.
    expect(ledger.post).toHaveBeenCalledTimes(1);
    const posted = ledger.post.mock.calls[0][0] as { amount: Prisma.Decimal };
    expect(posted.amount.toFixed(2)).toBe('-30.00');
  });

  it('rejects a refund when nothing is overpaid', async () => {
    const { service, read } = build();
    read.standing.mockResolvedValue({
      standing: { outstanding: D(40), overpaid: D(0) },
    });
    await expect(
      service.refundOverpayment(caller, 'credit-1', {
        amount: 10,
        accountCode: 'CASH',
      }),
    ).rejects.toThrow(/overpaid/);
  });
});
