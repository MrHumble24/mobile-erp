import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { runWithStoreSelection } from './lib/store-context.js';
import { StoresRepository } from './stores.repository.js';
import { StoresService } from './stores.service.js';

describe('StoresService', () => {
  let service: StoresService;
  let repo: jest.Mocked<StoresRepository>;

  const store1 = {
    id: 's1',
    name: 'Main Store',
    address: null,
    phone: null,
    deactivatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const store2 = {
    id: 's2',
    name: 'Branch 2',
    address: null,
    phone: null,
    deactivatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      list: jest.fn().mockResolvedValue([store1, store2]),
      listForUser: jest.fn().mockResolvedValue(['s1']),
      findById: jest.fn().mockResolvedValue(store1),
      findFirstActive: jest.fn().mockResolvedValue(store1),
      countDevices: jest.fn().mockResolvedValue(0),
      countQuantityStock: jest.fn().mockResolvedValue(0),
      countOpenShifts: jest.fn().mockResolvedValue(0),
      deactivate: jest.fn().mockResolvedValue({
        ...store1,
        deactivatedAt: new Date(),
      }),
      create: jest.fn(),
      update: jest
        .fn()
        .mockImplementation((id, data) =>
          Promise.resolve({ ...store1, ...data }),
        ),
      createSettings: jest.fn(),
      setUserStores: jest.fn(),
    } as unknown as jest.Mocked<StoresRepository>;
    service = new StoresService(repo);
  });

  describe('allowedStoreIds', () => {
    it('returns all active stores for user with store.all', async () => {
      const user: AuthenticatedUser = {
        id: 'u1',
        permissions: new Set(['store.all']),
      };
      const ids = await service.allowedStoreIds(user);
      expect(ids).toEqual(['s1', 's2']);
    });

    it('returns only assigned active stores for regular user', async () => {
      const user: AuthenticatedUser = {
        id: 'u2',
        permissions: new Set(['sale.create']),
      };
      repo.listForUser.mockResolvedValue(['s1']);
      const ids = await service.allowedStoreIds(user);
      expect(ids).toEqual(['s1']);
    });
  });

  describe('resolveStore', () => {
    it('rejects X-Store-Id: all when user lacks store.all', async () => {
      const user: AuthenticatedUser = {
        id: 'u2',
        permissions: new Set([]),
      };
      await expect(service.resolveStore(user, 'all')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows X-Store-Id: all when user holds store.all', async () => {
      const user: AuthenticatedUser = {
        id: 'u1',
        permissions: new Set(['store.all']),
      };
      const sel = await service.resolveStore(user, 'all');
      expect(sel).toEqual({ all: true, storeIds: ['s1', 's2'] });
    });

    it('rejects forbidden store header', async () => {
      const user: AuthenticatedUser = {
        id: 'u2',
        permissions: new Set([]),
      };
      repo.listForUser.mockResolvedValue(['s1']);
      await expect(service.resolveStore(user, 's2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('accepts allowed store header', async () => {
      const user: AuthenticatedUser = {
        id: 'u2',
        permissions: new Set([]),
      };
      repo.listForUser.mockResolvedValue(['s1']);
      const sel = await service.resolveStore(user, 's1');
      expect(sel).toEqual({ all: false, storeIds: ['s1'] });
    });

    it('marks pendingMultiple when multiple stores are allowed but no header', async () => {
      const user: AuthenticatedUser = {
        id: 'u1',
        permissions: new Set(['store.all']),
      };
      const sel = await service.resolveStore(user, undefined);
      expect(sel.pendingMultiple).toBe(true);
    });
  });

  describe('currentStoreId and currentStoreIds', () => {
    it('throws STORE_REQUIRED when pendingMultiple is true', async () => {
      await runWithStoreSelection(
        { all: false, storeIds: ['s1', 's2'], pendingMultiple: true },
        async () => {
          await expect(service.currentStoreId()).rejects.toThrow(
            BadRequestException,
          );
        },
      );
    });

    it('throws STORE_ALL when store selection is all on single-store call', async () => {
      await runWithStoreSelection(
        { all: true, storeIds: ['s1', 's2'] },
        async () => {
          await expect(service.currentStoreId()).rejects.toThrow(
            BadRequestException,
          );
        },
      );
    });

    it('returns store ID when single store is selected', async () => {
      await runWithStoreSelection(
        { all: false, storeIds: ['s1'] },
        async () => {
          const id = await service.currentStoreId();
          expect(id).toBe('s1');
        },
      );
    });

    it('throws STORE_REQUIRED when no store is selected', async () => {
      await expect(service.currentStoreId()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deactivate guards', () => {
    it('blocks deactivation when store has active devices', async () => {
      repo.countDevices.mockResolvedValue(3);
      await expect(service.deactivate('s1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('blocks deactivation when store has quantity stock', async () => {
      repo.countQuantityStock.mockResolvedValue(10);
      await expect(service.deactivate('s1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('blocks deactivation when store has open shifts', async () => {
      repo.countOpenShifts.mockResolvedValue(1);
      await expect(service.deactivate('s1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('successfully deactivates empty store', async () => {
      const result = await service.deactivate('s1');
      expect(result.deactivatedAt).toBeDefined();
    });
  });
});
