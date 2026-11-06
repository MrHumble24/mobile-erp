import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';

describe('StorefrontOrdersRepository (F6 / audit L5)', () => {
  let repo: StorefrontOrdersRepository;
  let txMock: {
    storefrontOrder: {
      updateMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
    storefrontOrderStatusHistory: {
      create: jest.Mock;
    };
  };
  let prismaMock: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    txMock = {
      storefrontOrder: {
        updateMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
      storefrontOrderStatusHistory: {
        create: jest.fn(),
      },
    };

    prismaMock = {
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => Promise<unknown>) =>
          callback(txMock),
        ),
    };

    repo = new StorefrontOrdersRepository(
      prismaMock as unknown as PrismaService,
    );
  });

  it('scopes update to where: { id, storeId } via updateMany', async () => {
    txMock.storefrontOrder.updateMany.mockResolvedValue({ count: 1 });
    txMock.storefrontOrder.findFirstOrThrow.mockResolvedValue({
      id: 'ord-1',
      storeId: 'store-1',
      statusCode: 'CONTACTED',
    });

    const res = await repo.updateOrderStatus(
      'store-1',
      'ord-1',
      'NEW',
      'CONTACTED',
      'user-1',
    );

    expect(txMock.storefrontOrder.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord-1', storeId: 'store-1' },
      data: expect.objectContaining({
        statusCode: 'CONTACTED',
        handledById: 'user-1',
      }),
    });
    expect(res.statusCode).toBe('CONTACTED');
  });

  it('throws NotFoundException when order does not match storeId (count is 0)', async () => {
    // Another store's order id given to store-1
    txMock.storefrontOrder.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repo.updateOrderStatus(
        'store-1',
        'ord-belonging-to-store-2',
        'NEW',
        'CONTACTED',
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(txMock.storefrontOrderStatusHistory.create).not.toHaveBeenCalled();
  });
});
