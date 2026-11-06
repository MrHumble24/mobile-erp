import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import type { PricingService } from '../pricing/pricing.service.js';
import type { StorefrontCatalogRepository } from './storefront-catalog.repository.js';
import type { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';
import type { StorefrontPublicOrdersService } from './storefront-public-orders.service.js';
import type { StorefrontRepository } from './storefront.repository.js';
import { StorefrontService } from './storefront.service.js';

describe('StorefrontService', () => {
  let service: StorefrontService;
  let repo: jest.Mocked<StorefrontRepository>;
  let catalog: jest.Mocked<StorefrontCatalogRepository>;
  let zonesRepo: jest.Mocked<StorefrontDeliveryZonesRepository>;
  let pricing: jest.Mocked<PricingService>;
  let ordersService: jest.Mocked<StorefrontPublicOrdersService>;

  beforeEach(() => {
    repo = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      activeStores: jest.fn(),
      activeCategories: jest.fn(),
      inStockUnitsForModels: jest.fn(),
      quantityStockForModels: jest.fn(),
      findModelById: jest.fn(),
      countModelInStockForStore: jest.fn(),
    } as unknown as jest.Mocked<StorefrontRepository>;

    catalog = {
      findInStockModels: jest.fn(),
    } as unknown as jest.Mocked<StorefrontCatalogRepository>;

    zonesRepo = {
      findActive: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<StorefrontDeliveryZonesRepository>;

    ordersService = {
      createOrder: jest.fn(),
      getPublicOrder: jest.fn(),
    } as unknown as jest.Mocked<StorefrontPublicOrdersService>;

    pricing = {
      listPriceForUnit: jest.fn(),
      listPriceForProduct: jest.fn(),
      pricesForUnits: jest.fn().mockImplementation((ctxs) => {
        const map = new Map();
        for (const c of ctxs) {
          map.set(c.deviceId, { RETAIL: c.targetPrice });
        }
        return Promise.resolve(map);
      }),
      pricesForProducts: jest.fn().mockImplementation((ctxs) => {
        const map = new Map();
        for (const c of ctxs) {
          map.set(c.modelId, { RETAIL: c.salePrice });
        }
        return Promise.resolve(map);
      }),
    } as unknown as jest.Mocked<PricingService>;

    service = new StorefrontService(
      repo,
      catalog,
      zonesRepo,
      pricing,
      ordersService,
      { listConfigs: jest.fn().mockResolvedValue([]) } as any,
      { payOrder: jest.fn() } as any,
    );
  });

  const baseSettings = {
    enabled: false,
    showPrices: true,
    contactPhone: null,
    contactTelegram: null,
    categoryIds: [],
    pickupEnabled: true,
    deliveryEnabled: false,
    deliveryPricingModeCode: 'FREE',
    deliveryFlatFee: null,
    deliveryFreeFrom: null,
    deliveryNote: null,
  };

  describe('getConfig', () => {
    it('returns { enabled: false } when storefront is disabled', async () => {
      repo.getSettings.mockResolvedValue(baseSettings);
      expect(await service.getConfig()).toEqual({ enabled: false });
    });

    it('returns full config when storefront is enabled', async () => {
      repo.getSettings.mockResolvedValue({
        ...baseSettings,
        enabled: true,
        contactPhone: '+998901234567',
        contactTelegram: '@shop',
        categoryIds: ['c1'],
      });
      repo.activeStores.mockResolvedValue([
        { id: 's1', name: 'Main', address: 'Tashkent', phone: '123' },
      ]);
      repo.activeCategories.mockResolvedValue([{ id: 'c1', name: 'Phones' }]);

      expect(await service.getConfig()).toEqual({
        enabled: true,
        shopName: 'Main',
        contactPhone: '+998901234567',
        contactTelegram: '@shop',
        showPrices: true,
        stores: [{ id: 's1', name: 'Main', address: 'Tashkent', phone: '123' }],
        categories: [{ id: 'c1', name: 'Phones' }],
        pickupEnabled: true,
        deliveryEnabled: false,
        deliveryPricingMode: 'FREE',
        deliveryFlatFee: null,
        deliveryFreeFrom: null,
        deliveryNote: null,
        deliveryZones: [],
        paymentProviders: [],
      });
    });
  });

  describe('storefront disabled checks', () => {
    beforeEach(() => {
      repo.getSettings.mockResolvedValue(baseSettings);
      ordersService.createOrder.mockRejectedValue(
        new NotFoundException({
          code: 'STOREFRONT_DISABLED',
          message: 'Storefront is currently disabled',
        }),
      );
    });

    it('getProducts throws 404 when disabled', async () => {
      await expect(service.getProducts({})).rejects.toThrow(NotFoundException);
    });

    it('getProduct throws 404 when disabled', async () => {
      await expect(service.getProduct('model-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('createOrder throws 404 when disabled', async () => {
      await expect(
        service.createOrder({
          name: 'Ali',
          phone: '+998901234567',
          modelId: 'm1',
          storeId: 's1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('products listing & multi-store aggregation', () => {
    beforeEach(() => {
      repo.getSettings.mockResolvedValue({
        enabled: true,
        showPrices: true,
        contactPhone: null,
        contactTelegram: null,
        categoryIds: [],
      });
      repo.activeStores.mockResolvedValue([
        { id: 's1', name: 'Branch 1', address: null, phone: null },
        { id: 's2', name: 'Branch 2', address: null, phone: null },
      ]);
    });

    it('shows both stores when a product has units in two stores', async () => {
      catalog.findInStockModels.mockResolvedValue([
        {
          id: 'm1',
          brand: 'Apple',
          name: 'iPhone 15',
          kindCode: 'IMEI',
          categoryId: 'c1',
          category: { id: 'c1', name: 'Smartphones' },
          imageFileName: null,
          salePrice: null,
        },
      ]);
      repo.inStockUnitsForModels.mockResolvedValue([
        {
          id: 'u1',
          modelId: 'm1',
          storeId: 's1',
          specs: { storage: '128GB' },
          targetPrice: new Prisma.Decimal(800),
        },
        {
          id: 'u2',
          modelId: 'm1',
          storeId: 's2',
          specs: { storage: '128GB' },
          targetPrice: new Prisma.Decimal(820),
        },
      ]);
      repo.quantityStockForModels.mockResolvedValue(new Map());
      pricing.listPriceForUnit.mockImplementation((_lvl, ctx) =>
        Promise.resolve(ctx.targetPrice),
      );

      const cards = await service.getProducts({});
      expect(cards).toHaveLength(1);
      expect(cards[0].inStock).toBe(2);
      expect(cards[0].priceFrom).toBe('800.00');
      expect(cards[0].stores).toEqual([
        { id: 's1', name: 'Branch 1' },
        { id: 's2', name: 'Branch 2' },
      ]);
    });

    it('only IN_STOCK units are passed from the repository', async () => {
      catalog.findInStockModels.mockResolvedValue([
        {
          id: 'm1',
          brand: 'Apple',
          name: 'iPhone 15',
          kindCode: 'IMEI',
          categoryId: null,
          category: null,
          imageFileName: null,
          salePrice: null,
        },
      ]);
      repo.inStockUnitsForModels.mockResolvedValue([]);
      repo.quantityStockForModels.mockResolvedValue(new Map());

      expect(await service.getProducts({})).toHaveLength(0);
    });

    it('a page of 10 does not price units of products outside that page (F3 / audit M2)', async () => {
      const pageModels = Array.from({ length: 10 }, (_, i) => ({
        id: `m-${i + 1}`,
        brand: 'Brand',
        name: `Model ${i + 1}`,
        kindCode: 'IMEI',
        categoryId: 'c1',
        category: { id: 'c1', name: 'Smartphones' },
        imageFileName: null,
        salePrice: null,
      }));

      catalog.findInStockModels.mockImplementation((_storeIds, filter) =>
        Promise.resolve(
          filter.page === 1 && filter.pageSize === 10 ? pageModels : [],
        ),
      );

      const pageUnits = pageModels.map((m, i) => ({
        id: `u-${i + 1}`,
        modelId: m.id,
        storeId: 's1',
        specs: { storage: '128GB' },
        targetPrice: new Prisma.Decimal(500 + i * 10),
      }));

      repo.inStockUnitsForModels.mockResolvedValue(pageUnits);
      repo.quantityStockForModels.mockResolvedValue(new Map());

      const pricedUnitIds: string[] = [];
      pricing.pricesForUnits.mockImplementation((ctxs) => {
        const map = new Map();
        for (const c of ctxs) {
          pricedUnitIds.push(c.deviceId);
          map.set(c.deviceId, { RETAIL: c.targetPrice });
        }
        return Promise.resolve(map);
      });

      const cards = await service.getProducts({ page: 1, pageSize: 10 });
      expect(cards).toHaveLength(10);
      expect(catalog.findInStockModels).toHaveBeenCalledWith(
        ['s1', 's2'],
        expect.objectContaining({ page: 1, pageSize: 10 }),
      );

      expect(repo.inStockUnitsForModels).toHaveBeenCalledWith(
        pageModels.map((m) => m.id),
        ['s1', 's2'],
      );
      expect(pricedUnitIds).toEqual(pageUnits.map((u) => u.id));
      expect(pricedUnitIds).not.toContain('u-11');
      expect(pricedUnitIds).not.toContain('u-outside');
    });
  });
});
