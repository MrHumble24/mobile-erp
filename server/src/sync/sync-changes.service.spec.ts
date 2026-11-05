import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { PartnersService } from '../partners/partners.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SyncChangesService } from './sync-changes.service.js';
import { SyncChangesRepository } from './sync-changes.repository.js';

const partner = {
  id: 'p1',
  shopName: 'Malika',
  phone: '+998',
  isActive: true,
  creditLimit: { toFixed: () => '100.00' },
  outstanding: { toFixed: () => '40.00' },
};

function build(callerPerms: string[]) {
  const repo = {
    pageSize: 500,
    devicesSince: jest.fn().mockResolvedValue([]),
  } as unknown as SyncChangesRepository;
  const list = jest.fn().mockResolvedValue([partner]);
  const partners = { list } as unknown as PartnersService;
  const productsForFeed = jest.fn().mockResolvedValue([]);
  const stock = { productsForFeed } as unknown as StockService;
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
  } as unknown as StoresService;
  const pricing = {
    pricesForUnits: jest.fn().mockResolvedValue(new Map()),
  } as unknown as PricingService;
  const caller: AuthenticatedUser = {
    id: 'c',
    email: 'c@x',
    permissions: new Set(callerPerms),
  };
  return {
    service: new SyncChangesService(repo, partners, stock, stores, pricing),
    caller,
    list,
    productsForFeed,
  };
}

describe('SyncChangesService partner exposure', () => {
  it('omits partners for a caller lacking partner.read', async () => {
    const { service, caller, list } = build(['device.read']);
    const out = await service.changes(caller, {});
    expect(out.partners).toEqual([]);
    expect(list).not.toHaveBeenCalled();
  });

  it('includes partner balances for a caller with partner.read', async () => {
    const { service, caller, list } = build(['device.read', 'partner.read']);
    const out = await service.changes(caller, {});
    expect(list).toHaveBeenCalled();
    expect(out.partners).toEqual([
      {
        id: 'p1',
        shopName: 'Malika',
        phone: '+998',
        creditLimit: '100.00',
        outstanding: '40.00',
      },
    ]);
  });
});
