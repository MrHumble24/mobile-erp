import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { PricingService } from '../pricing/pricing.service.js';
import { StoresService } from '../stores/stores.service.js';
import { StockRepository } from './stock.repository.js';
import { StockService } from './stock.service.js';

const D = (n: number | string) => new Prisma.Decimal(n);

const level = {
  modelId: 'm1',
  brand: 'Belkin',
  name: 'USB-C cable',
  barcode: '111',
  modelCode: null,
  categoryId: null,
  salePrice: D(30),
  quantity: 6,
  value: D(120),
  latestPurchaseCost: D(20),
};

function build(quantityInStock = 6) {
  const repo = {
    modelKind: jest.fn().mockResolvedValue('QUANTITY'),
    aggregate: jest.fn().mockResolvedValue({
      quantity: quantityInStock,
      value: D(quantityInStock * 20),
      latestPurchaseCost: D(20),
    }),
    create: jest.fn(),
    listStock: jest
      .fn()
      .mockResolvedValue([{ ...level, quantity: quantityInStock }]),
  } as unknown as StockRepository;
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
  } as unknown as StoresService;
  const pricing = {
    pricesForProducts: jest.fn().mockResolvedValue(new Map()),
  } as unknown as PricingService;
  return { service: new StockService(repo, stores, pricing), repo };
}

const caller = {
  id: 'u1',
  permissions: new Set(['device.read', 'stock.adjust', 'device.cost.view']),
} as unknown as AuthenticatedUser;

describe('StockService.adjust', () => {
  it('rejects a write-off without a note', async () => {
    const { service } = build();
    await expect(
      service.adjust(caller, { modelId: 'm1', type: 'WRITE_OFF', quantity: 1 }),
    ).rejects.toThrow(/note/);
  });

  it('writes a negative WRITE_OFF movement at the average cost', async () => {
    const { service, repo } = build();
    await service.adjust(caller, {
      modelId: 'm1',
      type: 'WRITE_OFF',
      quantity: 2,
      note: 'broken on shelf',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'WRITE_OFF',
        quantity: -2,
        unitCostSnapshot: D(20),
        note: 'broken on shelf',
      }),
    );
  });

  it('count correction writes the signed difference from the counted quantity', async () => {
    const { service, repo } = build(6); // server thinks 6
    await service.adjust(caller, {
      modelId: 'm1',
      type: 'COUNT_CORRECTION',
      countedQuantity: 4, // shelf shows 4 → diff -2
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: 'COUNT_CORRECTION', quantity: -2 }),
    );
  });

  it('count correction with no difference writes nothing', async () => {
    const { service, repo } = build(5);
    await service.adjust(caller, {
      modelId: 'm1',
      type: 'COUNT_CORRECTION',
      countedQuantity: 5,
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects adjusting a non-quantity product', async () => {
    const { service, repo } = build();
    (repo.modelKind as jest.Mock).mockResolvedValueOnce('IMEI');
    await expect(
      service.adjust(caller, {
        modelId: 'm1',
        type: 'WRITE_OFF',
        quantity: 1,
        note: 'x',
      }),
    ).rejects.toThrow(/quantity product/);
  });
});
