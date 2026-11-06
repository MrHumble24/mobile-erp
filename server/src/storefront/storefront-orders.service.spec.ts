import { NotFoundException } from '@nestjs/common';
import type { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';

describe('StorefrontOrdersService', () => {
  let service: StorefrontOrdersService;
  let repo: jest.Mocked<StorefrontOrdersRepository>;

  const mockOrder = {
    id: 'ord-1',
    storeId: 'store-1',
    modelId: 'm1',
    specs: { storage: '256GB' },
    customerName: 'Sardor',
    customerPhone: '+998901112233',
    note: null,
    statusCode: 'NEW',
    handledById: null,
    handledAt: null,
    saleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: { name: 'Branch 1' },
    model: { brand: 'Apple', name: 'iPhone 15' },
    status: { label: 'New' },
    handledBy: null,
    statusHistory: [],
  };

  beforeEach(() => {
    repo = {
      listOrders: jest.fn(),
      countNewOrders: jest.fn(),
      findOrderById: jest.fn(),
      findSaleInStore: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as unknown as jest.Mocked<StorefrontOrdersRepository>;

    service = new StorefrontOrdersService(repo);
  });

  describe('store scoping', () => {
    it('another store’s order returns 404', async () => {
      // Order belongs to store-2; caller is in store-1
      repo.findOrderById.mockResolvedValue(null);

      await expect(service.get('store-1', 'ord-999')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.findOrderById).toHaveBeenCalledWith('store-1', 'ord-999');
    });

    it('cashier of store-1 lists only store-1 orders', async () => {
      repo.listOrders.mockResolvedValue({
        items: [mockOrder],
        total: 1,
      });

      const res = await service.list('store-1', {});
      expect(repo.listOrders).toHaveBeenCalledWith('store-1', {
        status: undefined,
        from: undefined,
        to: undefined,
        page: 1,
        pageSize: 20,
      });
      expect(res.items).toHaveLength(1);
      expect(res.items[0].storeId).toBe('store-1');
    });
  });

  describe('status transition rules', () => {
    it('allows NEW -> CONTACTED', async () => {
      repo.findOrderById.mockResolvedValue(mockOrder);
      repo.updateOrderStatus.mockResolvedValue({
        ...mockOrder,
        statusCode: 'CONTACTED',
        status: { label: 'Contacted' },
      });

      const res = await service.updateStatus('store-1', 'ord-1', 'user-1', {
        statusCode: 'CONTACTED',
      });

      expect(res.statusCode).toBe('CONTACTED');
      expect(repo.updateOrderStatus).toHaveBeenCalledWith(
        'store-1',
        'ord-1',
        'NEW',
        'CONTACTED',
        'user-1',
        undefined,
      );
    });

    it('allows NEW -> CANCELLED', async () => {
      repo.findOrderById.mockResolvedValue(mockOrder);
      repo.updateOrderStatus.mockResolvedValue({
        ...mockOrder,
        statusCode: 'CANCELLED',
        status: { label: 'Cancelled' },
      });

      const res = await service.updateStatus('store-1', 'ord-1', 'user-1', {
        statusCode: 'CANCELLED',
      });
      expect(res.statusCode).toBe('CANCELLED');
    });

    it('allows CONTACTED -> DONE with saleId', async () => {
      const contactedOrder = { ...mockOrder, statusCode: 'CONTACTED' };
      repo.findOrderById.mockResolvedValue(contactedOrder);
      repo.findSaleInStore.mockResolvedValue({ id: 'sale-1' });
      repo.updateOrderStatus.mockResolvedValue({
        ...contactedOrder,
        statusCode: 'DONE',
        status: { label: 'Done' },
        saleId: 'sale-1',
      });

      const res = await service.updateStatus('store-1', 'ord-1', 'user-1', {
        statusCode: 'DONE',
        saleId: 'sale-1',
      });

      expect(res.statusCode).toBe('DONE');
      expect(res.saleId).toBe('sale-1');
    });

    it('rejects NEW -> DONE directly', async () => {
      repo.findOrderById.mockResolvedValue(mockOrder);

      await expect(
        service.updateStatus('store-1', 'ord-1', 'user-1', {
          statusCode: 'DONE',
        }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_STATUS_TRANSITION' },
      });
    });

    it('rejects transitions from terminal status DONE', async () => {
      const doneOrder = { ...mockOrder, statusCode: 'DONE' };
      repo.findOrderById.mockResolvedValue(doneOrder);

      await expect(
        service.updateStatus('store-1', 'ord-1', 'user-1', {
          statusCode: 'CONTACTED',
        }),
      ).rejects.toMatchObject({
        response: { code: 'ORDER_TERMINAL' },
      });
    });

    it('rejects transitions from terminal status CANCELLED', async () => {
      const cancelledOrder = { ...mockOrder, statusCode: 'CANCELLED' };
      repo.findOrderById.mockResolvedValue(cancelledOrder);

      await expect(
        service.updateStatus('store-1', 'ord-1', 'user-1', {
          statusCode: 'NEW',
        }),
      ).rejects.toMatchObject({
        response: { code: 'ORDER_TERMINAL' },
      });
    });

    it('rejects saleId when sale does not belong to the same store', async () => {
      const contactedOrder = { ...mockOrder, statusCode: 'CONTACTED' };
      repo.findOrderById.mockResolvedValue(contactedOrder);
      // Sale belongs to store-2 or does not exist
      repo.findSaleInStore.mockResolvedValue(null);

      await expect(
        service.updateStatus('store-1', 'ord-1', 'user-1', {
          statusCode: 'DONE',
          saleId: 'sale-from-store-2',
        }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_SALE' },
      });
    });
  });
});
