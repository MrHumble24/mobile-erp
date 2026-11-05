import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from '../stock/stock.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import type {
  CheckoutInput,
  QuantityCheckoutInput,
  ReturnInput,
} from './types/sale.types.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function build() {
  const tx = {
    customer: { upsert: jest.fn(), create: jest.fn() },
    device: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    deviceStatusHistory: { create: jest.fn() },
    sale: { create: jest.fn().mockResolvedValue({ id: 'sale-1' }) },
    saleReturn: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  const stock = {
    averageCost: jest.fn().mockResolvedValue(D(25)),
    postMovement: jest.fn(),
  } as unknown as StockService;
  return {
    repo: new SalesCheckoutRepository(prisma, ledger, stock),
    ledger,
    stock,
    tx,
  };
}

const base: CheckoutInput = {
  storeId: 'store-1',
  deviceId: 'dev-1',
  expectedVersion: 0,
  salePrice: 250,
  landedCostSnapshot: D(100),
  soldById: 'cashier-1',
  soldAt: new Date('2026-11-05T00:00:00Z'),
  warranty: { days: 14, startsAt: new Date(), endsAt: new Date() },
  payments: [],
};

describe('SalesCheckoutRepository.checkout', () => {
  it('posts one SALE row per payment, linked to the sale', async () => {
    const { repo, ledger } = build();
    await repo.checkout({
      ...base,
      payments: [
        { accountCode: 'CASH', amount: D(150) },
        { accountCode: 'CARD', amount: D(100) },
      ],
    });
    expect(ledger.post).toHaveBeenCalledTimes(2);
    expect(ledger.post).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        typeCode: 'SALE',
        accountCode: 'CASH',
        amount: D(150),
        saleId: 'sale-1',
      }),
      expect.anything(),
    );
    expect(ledger.post).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ accountCode: 'CARD', amount: D(100) }),
      expect.anything(),
    );
  });
});

const quantityBase: QuantityCheckoutInput = {
  storeId: 'store-1',
  modelId: 'model-1',
  quantity: 2,
  salePrice: 80,
  soldById: 'cashier-1',
  soldAt: new Date('2026-11-05T00:00:00Z'),
  payments: [],
};

describe('SalesCheckoutRepository.checkoutQuantity', () => {
  it('snapshots the average cost, writes a SALE movement and posts the money', async () => {
    const { repo, ledger, stock, tx } = build();
    await repo.checkoutQuantity({
      ...quantityBase,
      payments: [
        { accountCode: 'CASH', amount: D(50) },
        { accountCode: 'CARD', amount: D(30) },
      ],
    });
    // landedCostSnapshot = quantity (2) × average (25) = 50.
    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelId: 'model-1',
          quantity: 2,
          landedCostSnapshot: D(50),
        }),
      }),
    );
    // One outgoing SALE movement of -2 at the snapshot cost.
    expect(stock.postMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'SALE',
        quantity: -2,
        unitCostSnapshot: D(25),
        saleId: 'sale-1',
      }),
      expect.anything(),
    );
    // Split: one SALE ledger row per tender line (mixed cart, by split).
    expect(ledger.post).toHaveBeenCalledTimes(2);
  });
});

describe('SalesCheckoutRepository.processReturn', () => {
  it('posts each refund row as a negative REFUND (unit sale)', async () => {
    const { repo, ledger } = build();
    const input: ReturnInput = {
      saleId: 'sale-1',
      deviceId: 'dev-1',
      expectedVersion: 1,
      toStatusCode: 'IN_STOCK',
      refundAmount: 250,
      processedById: 'cashier-1',
      storeId: 'store-1',
      refundPostings: [{ accountCode: 'CARD', amount: D(100) }],
    };
    await repo.processReturn(input);
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'REFUND',
        accountCode: 'CARD',
        amount: D('-100'),
        saleId: 'sale-1',
      }),
      expect.anything(),
    );
  });

  it('restores stock at the sale unit cost for a quantity return', async () => {
    const { repo, stock, tx } = build();
    const input: ReturnInput = {
      saleId: 'sale-1',
      deviceId: null,
      expectedVersion: 0,
      toStatusCode: 'IN_STOCK',
      refundAmount: 80,
      processedById: 'cashier-1',
      storeId: 'store-1',
      refundPostings: [{ accountCode: 'CASH', amount: D(80) }],
      quantityRestore: { modelId: 'model-1', quantity: 2, unitCost: D(25) },
    };
    await repo.processReturn(input);
    expect(tx.device.updateMany).not.toHaveBeenCalled();
    expect(stock.postMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'RETURN',
        quantity: 2,
        unitCostSnapshot: D(25),
        saleId: 'sale-1',
      }),
      expect.anything(),
    );
  });
});
