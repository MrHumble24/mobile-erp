import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import type { PricingService } from '../pricing/pricing.service.js';
import type { TelegramService } from '../telegram/telegram.service.js';
import type { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';
import type { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import { StorefrontPublicOrdersService } from './storefront-public-orders.service.js';
import type { StorefrontRepository } from './storefront.repository.js';

describe('StorefrontPublicOrdersService createOrder & validation', () => {
  let service: StorefrontPublicOrdersService;
  let repo: jest.Mocked<StorefrontRepository>;
  let ordersRepo: jest.Mocked<StorefrontOrdersRepository>;
  let zonesRepo: jest.Mocked<StorefrontDeliveryZonesRepository>;
  let pricing: jest.Mocked<PricingService>;
  let telegram: jest.Mocked<TelegramService>;

  const defaultSettings = {
    enabled: true,
    showPrices: true,
    contactPhone: null,
    contactTelegram: null,
    categoryIds: [],
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryPricingModeCode: 'FREE',
    deliveryFlatFee: null,
    deliveryFreeFrom: null,
    deliveryNote: null,
  };

  const defaultModel = {
    id: 'm1',
    brand: 'Apple',
    name: 'iPhone 15',
    kindCode: 'IMEI',
    categoryId: null,
    category: null,
    imageFileName: null,
    salePrice: null,
  };

  beforeEach(() => {
    repo = {
      getSettings: jest.fn().mockResolvedValue(defaultSettings),
      activeStores: jest
        .fn()
        .mockResolvedValue([
          { id: 's1', name: 'Branch 1', address: null, phone: null },
        ]),
      findModelById: jest.fn(),
      countModelInStockForStore: jest.fn(),
      inStockUnitsForModels: jest.fn().mockResolvedValue([]),
      findStorefrontUnitForPricing: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<StorefrontRepository>;

    ordersRepo = {
      createOrder: jest.fn(),
      findPublicOrderById: jest.fn(),
    } as unknown as jest.Mocked<StorefrontOrdersRepository>;

    zonesRepo = {
      findById: jest.fn(),
      findActive: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<StorefrontDeliveryZonesRepository>;

    pricing = {
      listPriceForUnit: jest.fn(),
      listPriceForProduct: jest.fn(),
    } as unknown as jest.Mocked<PricingService>;

    telegram = {
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TelegramService>;

    service = new StorefrontPublicOrdersService(
      repo,
      ordersRepo,
      zonesRepo,
      pricing,
      telegram,
      { listConfigs: jest.fn().mockResolvedValue([]) } as any,
    );
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
    expect(ordersRepo.createOrder).not.toHaveBeenCalled();
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

  it('refuses when online payment is selected', async () => {
    await expect(
      service.createOrder({
        name: 'Customer',
        phone: '+998901234567',
        modelId: 'm1',
        storeId: 's1',
        paymentMethod: 'ONLINE',
      }),
    ).rejects.toMatchObject({
      response: { code: 'ONLINE_PAYMENT_NOT_AVAILABLE' },
    });
  });

  it('refuses delivery order without address', async () => {
    await expect(
      service.createOrder({
        name: 'Customer',
        phone: '+998901234567',
        modelId: 'm1',
        storeId: 's1',
        fulfillmentMethod: 'DELIVERY',
      }),
    ).rejects.toMatchObject({ response: { code: 'ADDRESS_REQUIRED' } });
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
    repo.findModelById.mockResolvedValue(defaultModel);
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
    repo.findModelById.mockResolvedValue(defaultModel);
    repo.countModelInStockForStore.mockResolvedValue(2);
    ordersRepo.createOrder.mockResolvedValue({ id: 'ord-123' });

    const res = await service.createOrder({
      name: 'Aziz',
      phone: '+998 90 123 45 67',
      modelId: 'm1',
      specs: { storage: '128GB' },
      storeId: 's1',
      note: 'Call after 2pm',
    });

    expect(res).toEqual({ id: 'ord-123' });
    expect(ordersRepo.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 's1',
        modelId: 'm1',
        specs: { storage: '128GB' },
        customerName: 'Aziz',
        customerPhone: '+998 90 123 45 67',
        note: 'Call after 2pm',
        fulfillmentMethodCode: 'PICKUP',
        paymentMethodCode: 'ON_RECEIPT',
      }),
    );
    expect(telegram.send).toHaveBeenCalled();
  });

  it('rejects order for a product whose category is hidden (404) (F5 / audit L4)', async () => {
    repo.getSettings.mockResolvedValue({
      ...defaultSettings,
      categoryIds: ['allowed-cat-1'],
    });
    repo.findModelById.mockResolvedValue({
      ...defaultModel,
      id: 'hidden-prod-1',
      categoryId: 'hidden-cat',
      category: { id: 'hidden-cat', name: 'Hidden Category' },
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
    repo.findModelById.mockResolvedValue(defaultModel);
    repo.countModelInStockForStore.mockResolvedValue(1);
    ordersRepo.createOrder.mockResolvedValue({ id: 'order-123' });

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
      {
        storage: '256GB',
        color: 'White',
      },
    );
  });

  it('creates delivery order with flat delivery fee snapshot', async () => {
    repo.getSettings.mockResolvedValue({
      ...defaultSettings,
      deliveryPricingModeCode: 'FLAT',
      deliveryFlatFee: '25000',
    });
    repo.findModelById.mockResolvedValue(defaultModel);
    repo.countModelInStockForStore.mockResolvedValue(1);
    ordersRepo.createOrder.mockResolvedValue({ id: 'ord-deliv' });

    const res = await service.createOrder({
      name: 'Customer',
      phone: '+998901234567',
      modelId: 'm1',
      storeId: 's1',
      fulfillmentMethod: 'DELIVERY',
      address: 'Amir Temur street 12',
    });

    expect(res).toEqual({ id: 'ord-deliv' });
    expect(ordersRepo.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        fulfillmentMethodCode: 'DELIVERY',
        address: 'Amir Temur street 12',
        deliveryFeeSnapshot: expect.any(Prisma.Decimal),
      }),
    );
  });
});
