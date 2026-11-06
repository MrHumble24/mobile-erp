import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PricingService } from '../pricing/pricing.service.js';
import type { TelegramService } from '../telegram/telegram.service.js';
import type { StorefrontRepository } from './storefront.repository.js';
import { StorefrontService } from './storefront.service.js';

describe('StorefrontService createOrder & validation', () => {
  let service: StorefrontService;
  let repo: jest.Mocked<StorefrontRepository>;
  let pricing: jest.Mocked<PricingService>;
  let telegram: jest.Mocked<TelegramService>;

  beforeEach(() => {
    repo = {
      getSettings: jest.fn().mockResolvedValue({
        enabled: true,
        showPrices: true,
        contactPhone: null,
        contactTelegram: null,
        categoryIds: [],
      }),
      activeStores: jest
        .fn()
        .mockResolvedValue([
          { id: 's1', name: 'Branch 1', address: null, phone: null },
        ]),
      findModelById: jest.fn(),
      countModelInStockForStore: jest.fn(),
      createOrder: jest.fn(),
    } as unknown as jest.Mocked<StorefrontRepository>;

    pricing = {} as unknown as jest.Mocked<PricingService>;
    telegram = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TelegramService>;

    service = new StorefrontService(repo, pricing, telegram);
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
    repo.activeStores.mockResolvedValue([]);

    await expect(
      service.createOrder({
        name: 'Customer',
        phone: '+998901234567',
        modelId: 'm1',
        storeId: 'inactive-store',
      }),
    ).rejects.toMatchObject({ response: { code: 'STORE_NOT_ACTIVE' } });
  });

  it('refuses when model does not exist', async () => {
    repo.findModelById.mockResolvedValue(null);

    await expect(
      service.createOrder({
        name: 'Customer',
        phone: '+998901234567',
        modelId: 'non-existent',
        storeId: 's1',
      }),
    ).rejects.toMatchObject({ response: { code: 'MODEL_NOT_FOUND' } });
  });

  it('refuses when model is out of stock', async () => {
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

  it('rejects order for a product whose category is hidden (404) (F5 / audit L4)', async () => {
    repo.getSettings.mockResolvedValue({
      enabled: true,
      showPrices: true,
      contactPhone: null,
      contactTelegram: null,
      categoryIds: ['allowed-cat-1'],
    });

    repo.findModelById.mockResolvedValue({
      id: 'hidden-prod-1',
      brand: 'Apple',
      name: 'iPhone 13',
      kindCode: 'IMEI',
      categoryId: 'hidden-cat',
      category: { id: 'hidden-cat', name: 'Hidden Category' },
      imageFileName: null,
      salePrice: null,
    });

    await expect(
      service.createOrder({
        name: 'Customer',
        phone: '+998901234567',
        modelId: 'hidden-prod-1',
        storeId: 's1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('checks color in addition to storage for phone stock check (F7 / audit L6)', async () => {
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

    repo.countModelInStockForStore.mockResolvedValue(1);
    repo.createOrder.mockResolvedValue({ id: 'order-123' });

    await service.createOrder({
      name: 'Ali',
      phone: '+998901234567',
      modelId: 'm1',
      storeId: 's1',
      specs: { storage: '256GB', color: 'White' },
    });

    expect(repo.countModelInStockForStore).toHaveBeenCalledWith(
      'm1',
      's1',
      'IMEI',
      { storage: '256GB', color: 'White' },
    );
  });
});
