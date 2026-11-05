import { SalesReadService } from './sales-read.service.js';
import { SalesRepository } from './sales.repository.js';
import { Prisma } from '../generated/client/client.js';
import type { LedgerService } from '../ledger/ledger.service.js';
import type { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import type { BonusService } from '../bonus/bonus.service.js';
import type { StoresService } from '../stores/stores.service.js';
import type { SettingsService } from '../settings/settings.service.js';

describe('SalesReadService listByCustomer store scoping (S7)', () => {
  it('scopes customer sales list to active store ids', async () => {
    const reads = {
      listByCustomer: jest.fn().mockResolvedValue([{ id: 'sale-1' }]),
    };
    const ledger = {
      salePayments: jest.fn().mockResolvedValue(new Map()),
    };
    const purchases = {
      tradeInsBySale: jest.fn().mockResolvedValue(new Map()),
    };
    const bonus = {
      summaryBySale: jest.fn().mockResolvedValue(new Map()),
    };
    const stores = {
      currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
    };
    const settings = {};

    const service = new SalesReadService(
      reads as unknown as SalesRepository,
      ledger as unknown as LedgerService,
      purchases as unknown as CustomerPurchasesService,
      bonus as unknown as BonusService,
      stores as unknown as StoresService,
      settings as unknown as SettingsService,
    );

    const result = await service.listByCustomer('cust-1');
    expect(stores.currentStoreIds).toHaveBeenCalled();
    expect(reads.listByCustomer).toHaveBeenCalledWith('cust-1', ['store-1']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sale-1');
  });
});

describe('SalesReadService and SalesRepository warrantyLookup cross-store (R4)', () => {
  it('passes activeStoreId to warrantyLookup and returns result', async () => {
    const reads = {
      warrantyLookup: jest.fn().mockResolvedValue({
        imei: '123',
        saleId: 'sale-1',
        salePrice: null,
        storeName: 'Other Store',
      }),
    };
    const stores = {
      currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
    };
    const service = new SalesReadService(
      reads as unknown as SalesRepository,
      {} as unknown as LedgerService,
      {} as unknown as CustomerPurchasesService,
      {} as unknown as BonusService,
      stores as unknown as StoresService,
      {} as unknown as SettingsService,
    );

    const result = await service.warrantyLookup('123');
    expect(stores.currentStoreIds).toHaveBeenCalled();
    expect(reads.warrantyLookup).toHaveBeenCalledWith('123', 'store-1');
    expect(result.salePrice).toBeNull();
    expect(result.storeName).toBe('Other Store');
  });

  it('preserves salePrice and sets storeName when sale belongs to active store', async () => {
    const prisma = {
      sale: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'sale-1',
          storeId: 'store-1',
          store: { name: 'Store 1' },
          salePrice: new Prisma.Decimal(500),
          soldAt: new Date(),
          deviceId: 'dev-1',
          device: { imei: '123', serialNumber: null },
          warranty: null,
          return: null,
        }),
      },
      qcInspection: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const repo = new SalesRepository(prisma as never);
    const result = await repo.warrantyLookup('123', 'store-1');
    expect(result).not.toBeNull();
    expect(result?.salePrice).toEqual(new Prisma.Decimal(500));
    expect(result?.storeName).toBe('Store 1');
  });

  it('redacts salePrice to null and sets storeName when sale belongs to another store', async () => {
    const prisma = {
      sale: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'sale-2',
          storeId: 'store-2',
          store: { name: 'Store 2' },
          salePrice: new Prisma.Decimal(500),
          soldAt: new Date(),
          deviceId: 'dev-2',
          device: { imei: '456', serialNumber: null },
          warranty: null,
          return: null,
        }),
      },
      qcInspection: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const repo = new SalesRepository(prisma as never);
    const result = await repo.warrantyLookup('456', 'store-1');
    expect(result).not.toBeNull();
    expect(result?.salePrice).toBeNull();
    expect(result?.storeName).toBe('Store 2');
  });
});
