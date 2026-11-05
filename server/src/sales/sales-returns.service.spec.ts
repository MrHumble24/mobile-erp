import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import { SalesReturnsService } from './sales-returns.service.js';

const caller: AuthenticatedUser = {
  id: 'cashier-1',
  email: 'c@x',
  permissions: new Set(['sale.return']),
};

function build() {
  const reads = {
    findSaleForReturn: jest.fn().mockResolvedValue({
      id: 'sale-1',
      deviceId: 'dev-1',
      modelId: null,
      quantity: null,
      storeId: 'store-1',
      salePrice: new Prisma.Decimal(250),
      landedCostSnapshot: new Prisma.Decimal(100),
    }),
    findDeviceState: jest.fn().mockResolvedValue({ version: 5 }),
    findById: jest.fn().mockResolvedValue({ id: 'sale-1' }),
  };
  const checkout = { processReturn: jest.fn().mockResolvedValue(undefined) };
  const ledger = { salePayments: jest.fn().mockResolvedValue(new Map()) };
  const service = new SalesReturnsService(
    reads as unknown as SalesRepository,
    checkout as unknown as SalesCheckoutRepository,
    ledger as unknown as LedgerService,
  );
  return { service, reads, checkout, ledger };
}

const ret = (refundAmount: number) =>
  ({ refundAmount, deviceToStatusCode: 'IN_STOCK' }) as never;

describe('SalesReturnsService refund cap (ADR 0028)', () => {
  it('allows a refund equal to the sale net (ledger sale)', async () => {
    const svc = build();
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(250) }]],
      ]),
    );
    await svc.service.processReturn(caller, 'sale-1', ret(250));
    expect(svc.checkout.processReturn).toHaveBeenCalled();
  });

  it('rejects one unit above the sale net (ledger sale)', async () => {
    const svc = build();
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(250) }]],
      ]),
    );
    await expect(
      svc.service.processReturn(caller, 'sale-1', ret(251)),
    ).rejects.toThrow(BadRequestException);
    expect(svc.checkout.processReturn).not.toHaveBeenCalled();
  });

  it('caps a pre-ledger sale at its salePrice: equal passes, above fails', async () => {
    const ok = build();
    await ok.service.processReturn(caller, 'sale-1', ret(250));
    expect(ok.checkout.processReturn).toHaveBeenCalled();

    const bad = build();
    await expect(
      bad.service.processReturn(caller, 'sale-1', ret(250.01)),
    ).rejects.toThrow(BadRequestException);
    expect(bad.checkout.processReturn).not.toHaveBeenCalled();
  });
});
