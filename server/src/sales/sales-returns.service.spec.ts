import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BonusService } from '../bonus/bonus.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import { SalesReturnsService } from './sales-returns.service.js';

const caller: AuthenticatedUser = {
  id: 'cashier-1',
  email: 'c@x',
  permissions: new Set(['sale.return']),
};
// Refunding the trade-in part (above money paid) needs purchase.create.
const buyer: AuthenticatedUser = {
  id: 'owner-1',
  email: 'o@x',
  permissions: new Set(['sale.return', 'purchase.create']),
};

function build() {
  const reads = {
    findSaleForReturn: jest.fn().mockResolvedValue({
      id: 'sale-1',
      deviceId: 'dev-1',
      modelId: null,
      quantity: null,
      storeId: 'store-1',
      creditId: null,
      salePrice: new Prisma.Decimal(250),
      landedCostSnapshot: new Prisma.Decimal(100),
      soldAt: new Date('2026-01-01'),
    }),
    findDeviceState: jest.fn().mockResolvedValue({ version: 5 }),
    findById: jest.fn().mockResolvedValue({ id: 'sale-1' }),
  };
  const checkout = { processReturn: jest.fn().mockResolvedValue(undefined) };
  const ledger = { salePayments: jest.fn().mockResolvedValue(new Map()) };
  const purchases = {
    tradeInTotalForSale: jest.fn().mockResolvedValue(new Prisma.Decimal(0)),
    tradeInsBySale: jest.fn().mockResolvedValue(new Map()),
    wasUnitBoughtBackAfter: jest.fn().mockResolvedValue(false),
  };
  const bonus = {
    reverseForSale: jest.fn().mockResolvedValue(undefined),
    summaryBySale: jest.fn().mockResolvedValue(new Map()),
  };
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
  };
  const service = new SalesReturnsService(
    reads as unknown as SalesRepository,
    checkout as unknown as SalesCheckoutRepository,
    ledger as unknown as LedgerService,
    purchases as unknown as CustomerPurchasesService,
    bonus as unknown as BonusService,
    stores as unknown as StoresService,
  );
  return { service, reads, checkout, ledger, purchases, bonus, stores };
}

const ret = (refundAmount: number) =>
  ({ refundAmount, deviceToStatusCode: 'IN_STOCK' }) as never;

describe('SalesReturnsService store scoping (S3)', () => {
  it('passes active storeId to findSaleForReturn and findDeviceState', async () => {
    const svc = build();
    await svc.service.processReturn(caller, 'sale-1', ret(250));
    expect(svc.reads.findSaleForReturn).toHaveBeenCalledWith(
      'sale-1',
      'store-1',
    );
    expect(svc.reads.findDeviceState).toHaveBeenCalledWith('dev-1', 'store-1');
  });

  it('refuses a return when the sale belongs to another store (404)', async () => {
    const svc = build();
    svc.reads.findSaleForReturn.mockResolvedValue(null);
    await expect(
      svc.service.processReturn(caller, 'sale-1', ret(250)),
    ).rejects.toThrow(NotFoundException);
    expect(svc.checkout.processReturn).not.toHaveBeenCalled();
  });

  it('refuses a return when the device is not found in the active store (404)', async () => {
    const svc = build();
    svc.reads.findDeviceState.mockResolvedValue(null);
    await expect(
      svc.service.processReturn(caller, 'sale-1', ret(250)),
    ).rejects.toThrow(NotFoundException);
    expect(svc.checkout.processReturn).not.toHaveBeenCalled();
  });
});

describe('SalesReturnsService buy-back gate (ADR 0044)', () => {
  it('refuses a return once the unit has been bought back', async () => {
    const svc = build();
    svc.purchases.wasUnitBoughtBackAfter.mockResolvedValue(true);
    await expect(
      svc.service.processReturn(caller, 'sale-1', ret(250)),
    ).rejects.toMatchObject({ response: { code: 'SALE_UNIT_BOUGHT_BACK' } });
    expect(svc.checkout.processReturn).not.toHaveBeenCalled();
  });
});

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

  it('raises the cap by the trade-in value: paid + trade-in passes (ADR 0039)', async () => {
    const svc = build();
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(150) }]],
      ]),
    );
    svc.purchases.tradeInTotalForSale.mockResolvedValue(
      new Prisma.Decimal(100),
    );
    // 150 paid + 100 trade-in = 250 cap; the trade-in part needs purchase.create.
    await svc.service.processReturn(buyer, 'sale-1', ret(250));
    expect(svc.checkout.processReturn).toHaveBeenCalled();

    const bad = build();
    bad.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(150) }]],
      ]),
    );
    bad.purchases.tradeInTotalForSale.mockResolvedValue(
      new Prisma.Decimal(100),
    );
    await expect(
      bad.service.processReturn(buyer, 'sale-1', ret(251)),
    ).rejects.toThrow(BadRequestException);
    expect(bad.checkout.processReturn).not.toHaveBeenCalled();
  });

  it('refuses the trade-in part of a refund without purchase.create (403)', async () => {
    const svc = build();
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(150) }]],
      ]),
    );
    svc.purchases.tradeInTotalForSale.mockResolvedValue(
      new Prisma.Decimal(100),
    );
    // 150 paid; the cashier (no purchase.create) may refund only 150.
    await svc.service.processReturn(caller, 'sale-1', ret(150));
    expect(svc.checkout.processReturn).toHaveBeenCalled();

    const bad = build();
    bad.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(150) }]],
      ]),
    );
    bad.purchases.tradeInTotalForSale.mockResolvedValue(
      new Prisma.Decimal(100),
    );
    await expect(
      bad.service.processReturn(caller, 'sale-1', ret(200)),
    ).rejects.toMatchObject({
      response: { code: 'TRADE_IN_REFUND_FORBIDDEN' },
    });
    expect(bad.checkout.processReturn).not.toHaveBeenCalled();
  });

  it('caps a credit sale at zero (no SALE rows; money came via CreditPayment, ADR 0035)', async () => {
    const svc = build();
    svc.reads.findSaleForReturn.mockResolvedValue({
      id: 'sale-1',
      deviceId: 'dev-1',
      modelId: null,
      quantity: null,
      storeId: 'store-1',
      creditId: 'credit-1',
      salePrice: new Prisma.Decimal(250),
      landedCostSnapshot: new Prisma.Decimal(100),
    });
    await svc.service.processReturn(caller, 'sale-1', ret(0)); // zero passes
    expect(svc.checkout.processReturn).toHaveBeenCalled();

    const bad = build();
    bad.reads.findSaleForReturn.mockResolvedValue({
      id: 'sale-1',
      deviceId: 'dev-1',
      modelId: null,
      quantity: null,
      storeId: 'store-1',
      creditId: 'credit-1',
      salePrice: new Prisma.Decimal(250),
      landedCostSnapshot: new Prisma.Decimal(100),
    });
    await expect(
      bad.service.processReturn(caller, 'sale-1', ret(1)),
    ).rejects.toThrow(BadRequestException);
    expect(bad.checkout.processReturn).not.toHaveBeenCalled();
  });
});
