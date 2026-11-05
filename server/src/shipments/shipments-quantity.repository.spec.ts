import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from '../stock/stock.service.js';
import { ShipmentsQuantityRepository } from './shipments-quantity.repository.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function build() {
  const tx = {
    shipment: {
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ storeId: 'store-1', paymentAccountCode: 'CASH' }),
    },
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  const stock = { postMovement: jest.fn() } as unknown as StockService;
  return {
    repo: new ShipmentsQuantityRepository(prisma, ledger, stock),
    ledger,
    stock,
  };
}

describe('ShipmentsQuantityRepository.purchase', () => {
  it('writes a PURCHASE movement and a PURCHASE ledger row together', async () => {
    const { repo, ledger, stock } = build();
    const out = await repo.purchase(
      'ship-1',
      [{ modelId: 'm1', quantity: 10, unitCost: 20 }],
      'user-1',
    );
    expect(stock.postMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        modelId: 'm1',
        typeCode: 'PURCHASE',
        quantity: 10,
        unitCostSnapshot: D(20),
        shipmentId: 'ship-1',
      }),
      expect.anything(),
    );
    // 10 × 20 = 200 leaves the shipment's CASH account.
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({
        accountCode: 'CASH',
        typeCode: 'PURCHASE',
        amount: D('-200'),
        shipmentId: 'ship-1',
      }),
      expect.anything(),
    );
    expect(out).toEqual([{ modelId: 'm1', quantity: 10, unitCost: '20.00' }]);
  });
});
