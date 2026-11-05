import { SalesReadService } from './sales-read.service.js';
import type { SalesRepository } from './sales.repository.js';
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
