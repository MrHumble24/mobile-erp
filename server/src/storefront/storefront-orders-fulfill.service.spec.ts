import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import type { LedgerService } from '../ledger/ledger.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SalesService } from '../sales/sales.service.js';
import { StorefrontOrdersFulfillService } from './storefront-orders-fulfill.service.js';
import type { StorefrontOrdersRepository } from './storefront-orders.repository.js';

describe('StorefrontOrdersFulfillService', () => {
  let service: StorefrontOrdersFulfillService;
  let repo: jest.Mocked<StorefrontOrdersRepository>;
  let prisma: jest.Mocked<PrismaService>;
  let ledger: jest.Mocked<LedgerService>;
  let sales: jest.Mocked<SalesService>;

  const caller = {
    id: 'user-1',
    name: 'Cashier',
    email: 'c@test.com',
    role: 'CASHIER',
    permissions: [],
    storeId: 'store-1',
  };

  const baseOrder = {
    id: 'ord-1',
    storeId: 'store-1',
    modelId: 'm1',
    specs: { storage: '128GB' },
    customerName: 'Customer',
    customerPhone: '+998901234567',
    note: null,
    fulfillmentMethodCode: 'PICKUP',
    fulfillmentMethod: { label: 'Pickup' },
    address: null,
    deliveryZoneId: null,
    deliveryZone: null,
    paymentMethodCode: 'ON_RECEIPT',
    paymentMethod: { label: 'On receipt' },
    priceSnapshot: new Prisma.Decimal(1000),
    deliveryFeeSnapshot: new Prisma.Decimal(0),
    deviceId: null,
    statusCode: 'CONTACTED',
    handledById: 'user-1',
    handledAt: new Date(),
    saleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: { name: 'Main' },
    model: { brand: 'Apple', name: 'iPhone 15', kindCode: 'IMEI' },
    status: { label: 'Contacted' },
    handledBy: { firstName: 'Cashier', lastName: 'One' },
    statusHistory: [],
  };

  beforeEach(() => {
    repo = {
      findOrderById: jest.fn(),
      findUnitById: jest.fn(),
      findOldestInStockUnit: jest.fn(),
      holdDevice: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<StorefrontOrdersRepository>;

    prisma = {
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb({})),
    } as unknown as jest.Mocked<PrismaService>;

    ledger = {
      post: jest.fn().mockResolvedValue({ id: 'led-1' }),
    } as unknown as jest.Mocked<LedgerService>;

    sales = {
      create: jest.fn().mockResolvedValue({ id: 'sale-123' }),
    } as unknown as jest.Mocked<SalesService>;

    service = new StorefrontOrdersFulfillService(repo, prisma, ledger, sales);
  });

  describe('hold', () => {
    it('throws 404 when order does not exist in store', async () => {
      repo.findOrderById.mockResolvedValue(null);
      await expect(
        service.hold('store-1', 'ord-404', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects terminal orders', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        statusCode: 'DONE',
      } as never);
      await expect(
        service.hold('store-1', 'ord-1', 'user-1'),
      ).rejects.toMatchObject({
        response: { code: 'ORDER_TERMINAL' },
      });
    });

    it('rejects holding quantity products', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        model: { ...baseOrder.model, kindCode: 'QUANTITY' },
      } as never);
      await expect(
        service.hold('store-1', 'ord-1', 'user-1'),
      ).rejects.toMatchObject({
        response: { code: 'QUANTITY_PRODUCT_NOT_HELD' },
      });
    });

    it('rejects when order already holds a device', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        deviceId: 'dev-1',
      } as never);
      await expect(
        service.hold('store-1', 'ord-1', 'user-1'),
      ).rejects.toMatchObject({
        response: { code: 'ORDER_ALREADY_HOLDS_DEVICE' },
      });
    });

    it('rejects when named device is not in stock', async () => {
      repo.findOrderById.mockResolvedValue(baseOrder as never);
      repo.findUnitById.mockResolvedValue({
        id: 'dev-2',
        statusCode: 'SOLD',
        modelId: 'm1',
      } as never);
      await expect(
        service.hold('store-1', 'ord-1', 'user-1', { deviceId: 'dev-2' }),
      ).rejects.toMatchObject({ response: { code: 'DEVICE_NOT_AVAILABLE' } });
    });

    it('rejects when named device model mismatches', async () => {
      repo.findOrderById.mockResolvedValue(baseOrder as never);
      repo.findUnitById.mockResolvedValue({
        id: 'dev-2',
        statusCode: 'IN_STOCK',
        modelId: 'm2',
      } as never);
      await expect(
        service.hold('store-1', 'ord-1', 'user-1', { deviceId: 'dev-2' }),
      ).rejects.toMatchObject({ response: { code: 'MODEL_MISMATCH' } });
    });

    it('throws NO_STOCK_AVAILABLE when auto-selecting oldest and none found', async () => {
      repo.findOrderById.mockResolvedValue(baseOrder as never);
      repo.findOldestInStockUnit.mockResolvedValue(null);
      await expect(
        service.hold('store-1', 'ord-1', 'user-1'),
      ).rejects.toMatchObject({
        response: { code: 'NO_STOCK_AVAILABLE' },
      });
    });

    it('successfully holds oldest unit when deviceId is omitted', async () => {
      repo.findOrderById
        .mockResolvedValueOnce(baseOrder as never)
        .mockResolvedValueOnce({ ...baseOrder, deviceId: 'dev-auto' } as never);
      repo.findOldestInStockUnit.mockResolvedValue({ id: 'dev-auto' } as never);

      const res = await service.hold('store-1', 'ord-1', 'user-1');
      expect(repo.holdDevice).toHaveBeenCalledWith(
        'ord-1',
        'dev-auto',
        'user-1',
      );
      expect(res.deviceId).toBe('dev-auto');
    });
  });

  describe('handOver', () => {
    it('rejects orders not in CONTACTED or SHIPPED status', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        statusCode: 'NEW',
      } as never);
      await expect(
        service.handOver('store-1', 'ord-1', caller, {
          payments: [{ accountCode: 'CASH', amount: 1000 }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'ORDER_NOT_READY_FOR_HANDOVER' },
      });
    });

    it('rejects handover when priceSnapshot is missing', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        priceSnapshot: null,
      } as never);
      await expect(
        service.handOver('store-1', 'ord-1', caller, {
          payments: [{ accountCode: 'CASH', amount: 1000 }],
        }),
      ).rejects.toMatchObject({ response: { code: 'PRICE_SNAPSHOT_MISSING' } });
    });

    it('rejects handover when unit product has no held device', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        deviceId: null,
      } as never);
      await expect(
        service.handOver('store-1', 'ord-1', caller, {
          payments: [{ accountCode: 'CASH', amount: 1000 }],
        }),
      ).rejects.toMatchObject({ response: { code: 'NO_HELD_DEVICE' } });
    });

    it('rejects handover when fee > 0 and deliveryFeeAccountCode is missing', async () => {
      repo.findOrderById.mockResolvedValue({
        ...baseOrder,
        deviceId: 'dev-1',
        deliveryFeeSnapshot: new Prisma.Decimal(25000),
      } as never);
      await expect(
        service.handOver('store-1', 'ord-1', caller, {
          payments: [{ accountCode: 'CASH', amount: 1000 }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'DELIVERY_FEE_ACCOUNT_REQUIRED' },
      });
    });

    it('completes handover, creates sale with frozen price and marks DONE', async () => {
      const order = {
        ...baseOrder,
        deviceId: 'dev-1',
        statusCode: 'SHIPPED',
        deliveryFeeSnapshot: new Prisma.Decimal(25000),
      };
      repo.findOrderById.mockResolvedValue(order as never);
      repo.findUnitById.mockResolvedValue({
        id: 'dev-1',
        imei: '123456789012345',
      } as never);
      repo.updateOrderStatus.mockResolvedValue({
        ...order,
        statusCode: 'DONE',
        saleId: 'sale-123',
        status: { label: 'Done' },
      } as never);

      const res = await service.handOver('store-1', 'ord-1', caller, {
        payments: [{ accountCode: 'CASH', amount: 1000 }],
        deliveryFeeAccountCode: 'CASH',
      });

      expect(sales.create).toHaveBeenCalledWith(
        caller,
        expect.objectContaining({ imei: '123456789012345', salePrice: 1000 }),
        expect.objectContaining({
          storefrontOrderId: 'ord-1',
          trustClientPrice: true,
        }),
      );
      expect(ledger.post).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store-1',
          typeCode: 'DELIVERY_FEE',
          amount: new Prisma.Decimal(25000),
          orderId: 'ord-1',
        }),
        expect.anything(),
      );
      expect(repo.updateOrderStatus).toHaveBeenCalledWith(
        'store-1',
        'ord-1',
        'SHIPPED',
        'DONE',
        'user-1',
        'sale-123',
        expect.anything(),
      );
      expect(res.statusCode).toBe('DONE');
      expect(res.saleId).toBe('sale-123');
    });
  });
});
