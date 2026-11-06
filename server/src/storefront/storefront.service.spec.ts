import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import type { PricingService } from '../pricing/pricing.service.js';
import type { TelegramService } from '../telegram/telegram.service.js';
import type { StorefrontRepository } from './storefront.repository.js';
import { StorefrontService } from './storefront.service.js';

describe('StorefrontService', () => {
  let service: StorefrontService;
  let repo: jest.Mocked<StorefrontRepository>;
  let pricing: jest.Mocked<PricingService>;
  let telegram: jest.Mocked<TelegramService>;

  beforeEach(() => {
    repo = {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      activeStores: jest.fn(),
      activeCategories: jest.fn(),
      findActiveModels: jest.fn(),
      inStockUnitsForModels: jest.fn(),
      quantityStockForModels: jest.fn(),
      findModelById: jest.fn(),
      countModelInStockForStore: jest.fn(),
      createOrder: jest.fn(),
    } as unknown as jest.Mocked<StorefrontRepository>;

    pricing = {
      listPriceForUnit: jest.fn(),
      listPriceForProduct: jest.fn(),
      pricesForUnits: jest.fn(),
      pricesForProducts: jest.fn(),
    } as unknown as jest.Mocked<PricingService>;

    telegram = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TelegramService>;
    service = new StorefrontService(repo, pricing, telegram);
  });

  describe('getConfig', () => {
    it('returns { enabled: false } when storefront is disabled', async () => {
      repo.getSettings.mockResolvedValue({
        enabled: false,
        showPrices: true,
        contactPhone: null,
        contactTelegram: null,
        categoryIds: [],
      });
      expect(await service.getConfig()).toEqual({ enabled: false });
    });

    it('returns full config when storefront is enabled', async () => {
      repo.getSettings.mockResolvedValue({
        enabled: true,
        showPrices: true,
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
      });
    });
  });

  describe('storefront disabled checks', () => {
    beforeEach(() => {
      repo.getSettings.mockResolvedValue({
        enabled: false,
        showPrices: true,
        contactPhone: null,
        contactTelegram: null,
        categoryIds: [],
      });
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
      repo.findActiveModels.mockResolvedValue([
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
      repo.findActiveModels.mockResolvedValue([
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
  });

  describe('createOrder refusals & honeypot', () => {
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
      ]);
    });

    it('silently drops order and returns 201 when honeypot is filled', async () => {
      const res = await service.createOrder({
        name: 'Bot',
        phone: '+998901234567',
        modelId: 'm1',
        storeId: 's1',
        hp: 'spam-link',
      });
      expect(res.id).toBeDefined();
      expect(repo.createOrder).not.toHaveBeenCalled();
      expect(telegram.send).not.toHaveBeenCalled();
    });

    it('refuses when phone number is not plausible', async () => {
      await expect(
        service.createOrder({
          name: 'Customer',
          phone: '123',
          modelId: 'm1',
          storeId: 's1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses when store is not active', async () => {
      await expect(
        service.createOrder({
          name: 'Customer',
          phone: '+998901234567',
          modelId: 'm1',
          storeId: 's999',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses with OUT_OF_STOCK when item is not in stock in that store', async () => {
      repo.findModelById.mockResolvedValue({
        id: 'm1',
        brand: 'Apple',
        name: 'iPhone 15',
        kindCode: 'IMEI',
        categoryId: null,
        category: null,
        imageFileName: null,
        salePrice: null,
      });
      repo.countModelInStockForStore.mockResolvedValue(0);

      await expect(
        service.createOrder({
          name: 'Customer',
          phone: '+998901234567',
          modelId: 'm1',
          storeId: 's1',
        }),
      ).rejects.toMatchObject({ response: { code: 'OUT_OF_STOCK' } });
    });

    it('creates order and sends telegram alert on valid submission', async () => {
      repo.findModelById.mockResolvedValue({
        id: 'm1',
        brand: 'Apple',
        name: 'iPhone 15',
        kindCode: 'IMEI',
        categoryId: null,
        category: null,
        imageFileName: null,
        salePrice: null,
      });
      repo.countModelInStockForStore.mockResolvedValue(2);
      repo.createOrder.mockResolvedValue({ id: 'ord-123' });

      const res = await service.createOrder({
        name: 'Aziz',
        phone: '+998 90 123 45 67',
        modelId: 'm1',
        specs: { storage: '128GB' },
        storeId: 's1',
        note: 'Call after 2pm',
      });

      expect(res).toEqual({ id: 'ord-123' });
      expect(repo.createOrder).toHaveBeenCalledWith({
        storeId: 's1',
        modelId: 'm1',
        specs: { storage: '128GB' },
        customerName: 'Aziz',
        customerPhone: '+998 90 123 45 67',
        note: 'Call after 2pm',
      });
      expect(telegram.send).toHaveBeenCalled();
    });
  });
});
