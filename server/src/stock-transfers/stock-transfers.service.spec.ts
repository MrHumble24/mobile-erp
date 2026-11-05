import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockRepository } from '../stock/stock.repository.js';
import { StoresService } from '../stores/stores.service.js';
import { StockTransfersRepository } from './stock-transfers.repository.js';
import { StockTransfersService } from './stock-transfers.service.js';
import type { StockTransferView } from './types/stock-transfer.types.js';

describe('StockTransfersService', () => {
  let service: StockTransfersService;
  let prisma: jest.Mocked<PrismaService>;
  let repo: jest.Mocked<StockTransfersRepository>;
  let stores: jest.Mocked<StoresService>;
  let stockRepo: jest.Mocked<StockRepository>;

  const caller: AuthenticatedUser = {
    id: 'u1',
    permissions: new Set(['transfer.create', 'transfer.receive']),
  };

  const sampleTransfer = {
    id: 'tr-1',
    transferNumber: 'TR-1',
    sourceStoreId: 's1',
    sourceStore: { id: 's1', name: 'Main Store' },
    targetStoreId: 's2',
    targetStore: { id: 's2', name: 'Branch 2' },
    status: 'SENT',
    note: null,
    sentAt: '2026-11-05T00:00:00.000Z',
    sentById: 'u1',
    receivedAt: null,
    receivedById: null,
    cancelledAt: null,
    cancelledById: null,
    lines: [],
    createdAt: '2026-11-05T00:00:00.000Z',
  } as unknown as StockTransferView;

  function mockTxCount(transferCount = 1, devCount = 1) {
    prisma.$transaction.mockImplementationOnce(
      (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          stockTransfer: {
            create: jest.fn().mockResolvedValue({ id: 'tr-1' }),
            updateMany: jest.fn().mockResolvedValue({ count: transferCount }),
          },
          stockTransferLine: { create: jest.fn() },
          device: {
            update: jest.fn(),
            updateMany: jest.fn().mockResolvedValue({ count: devCount }),
          },
          deviceStatusHistory: { create: jest.fn() },
          stockMovement: { create: jest.fn() },
        }),
    );
  }

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(
        async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
          return cb({
            stockTransfer: {
              create: jest.fn().mockResolvedValue({ id: 'tr-1' }),
              update: jest.fn().mockResolvedValue({ id: 'tr-1' }),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            stockTransferLine: { create: jest.fn() },
            device: {
              update: jest.fn(),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            deviceStatusHistory: { create: jest.fn() },
            stockMovement: { create: jest.fn() },
          });
        },
      ),
      device: { findUnique: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    repo = {
      findById: jest.fn().mockResolvedValue(sampleTransfer),
      list: jest.fn().mockResolvedValue({ items: [sampleTransfer], total: 1 }),
    } as unknown as jest.Mocked<StockTransfersRepository>;

    stores = {
      currentStoreId: jest.fn().mockResolvedValue('s1'),
      currentStoreIds: jest.fn().mockResolvedValue(['s1']),
      get: jest.fn().mockResolvedValue({
        id: 's2',
        name: 'Branch 2',
        address: null,
        phone: null,
        deactivatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      allowedStoreIds: jest.fn().mockResolvedValue(['s1', 's2']),
    } as unknown as jest.Mocked<StoresService>;

    stockRepo = {
      modelKind: jest.fn().mockResolvedValue('QUANTITY'),
      aggregate: jest.fn().mockResolvedValue({
        quantity: 10,
        value: new Prisma.Decimal(100),
        latestPurchaseCost: new Prisma.Decimal(10),
      }),
    } as unknown as jest.Mocked<StockRepository>;

    service = new StockTransfersService(prisma, repo, stores, stockRepo);
  });

  describe('get (S6)', () => {
    it('throws 404 when transfer does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.get(caller, 'tr-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when caller does not belong to source or target store', async () => {
      stores.allowedStoreIds.mockResolvedValueOnce(['s3']);
      await expect(service.get(caller, 'tr-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns transfer when caller belongs to source store', async () => {
      stores.allowedStoreIds.mockResolvedValueOnce(['s1']);
      const res = await service.get(caller, 'tr-1');
      expect(res.id).toBe('tr-1');
    });

    it('returns transfer when caller belongs to target store', async () => {
      stores.allowedStoreIds.mockResolvedValueOnce(['s2']);
      const res = await service.get(caller, 'tr-1');
      expect(res.id).toBe('tr-1');
    });
  });

  describe('create', () => {
    it('refuses transfer to same store', async () => {
      await expect(
        service.create(caller, { targetStoreId: 's1', lines: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses transfer to deactivated store', async () => {
      stores.get.mockResolvedValueOnce({
        id: 's2',
        name: 'Branch 2',
        address: null,
        phone: null,
        deactivatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(
        service.create(caller, { targetStoreId: 's2', lines: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses unit transfer when device is not IN_STOCK', async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'd1',
        storeId: 's1',
        statusCode: 'DEFECTIVE',
      });
      await expect(
        service.create(caller, {
          targetStoreId: 's2',
          lines: [{ lineType: 'UNIT', deviceId: 'd1' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses quantity transfer when stock is insufficient', async () => {
      stockRepo.aggregate.mockResolvedValueOnce({
        quantity: 2,
        value: new Prisma.Decimal(20),
        latestPurchaseCost: new Prisma.Decimal(10),
      });
      await expect(
        service.create(caller, {
          targetStoreId: 's2',
          lines: [{ lineType: 'QUANTITY', modelId: 'm1', quantity: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates transfer successfully when lines are valid', async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'd1',
        storeId: 's1',
        statusCode: 'IN_STOCK',
      });
      const res = await service.create(caller, {
        targetStoreId: 's2',
        lines: [
          { lineType: 'UNIT', deviceId: 'd1' },
          { lineType: 'QUANTITY', modelId: 'm1', quantity: 5 },
        ],
      });
      expect(res.id).toBe('tr-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws ConflictException when device is concurrently modified during send (S5)', async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'd1',
        storeId: 's1',
        statusCode: 'IN_STOCK',
      });
      mockTxCount(1, 0);
      await expect(
        service.create(caller, {
          targetStoreId: 's2',
          lines: [{ lineType: 'UNIT', deviceId: 'd1' }],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('receive', () => {
    it('refuses receive when current store is not target store', async () => {
      stores.currentStoreId.mockResolvedValueOnce('s1');
      await expect(service.receive(caller, 'tr-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('receives transfer when current store matches target store', async () => {
      stores.currentStoreId.mockResolvedValueOnce('s2');
      const res = await service.receive(caller, 'tr-1');
      expect(res.id).toBe('tr-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws ConflictException when transfer is concurrently received or cancelled (S5)', async () => {
      stores.currentStoreId.mockResolvedValueOnce('s2');
      mockTxCount(0, 1);
      await expect(service.receive(caller, 'tr-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancel', () => {
    it('refuses cancel when caller does not belong to source store', async () => {
      stores.allowedStoreIds.mockResolvedValueOnce(['s2']);
      await expect(service.cancel(caller, 'tr-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('cancels transfer when caller belongs to source store', async () => {
      stores.allowedStoreIds.mockResolvedValueOnce(['s1']);
      const res = await service.cancel(caller, 'tr-1');
      expect(res.id).toBe('tr-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws ConflictException when transfer is concurrently received or cancelled (S5)', async () => {
      stores.allowedStoreIds.mockResolvedValueOnce(['s1']);
      mockTxCount(0, 1);
      await expect(service.cancel(caller, 'tr-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
