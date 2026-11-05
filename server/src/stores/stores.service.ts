import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { UpdateStoreDto } from './dto/update-store.dto.js';
import {
  getStoreSelection,
  type StoreContextSelection,
} from './lib/store-context.js';
import { StoresRepository } from './stores.repository.js';
import type { StoreIdentity, StoreView } from './types/store.types.js';

export const STORE_FORBIDDEN = 'STORE_FORBIDDEN';
export const STORE_REQUIRED = 'STORE_REQUIRED';
export const STORE_ALL = 'STORE_ALL';
export const STORE_DEACTIVATE_BLOCKED = 'STORE_DEACTIVATE_BLOCKED';

@Injectable()
export class StoresService {
  constructor(private readonly repo: StoresRepository) {}

  /**
   * Store IDs the caller may work in. Every active store when the caller holds
   * `store.all` (owner/admin); otherwise the assigned active `user_stores`.
   */
  async allowedStoreIds(
    user: AuthenticatedUser | undefined,
  ): Promise<string[]> {
    if (!user) {
      const active = await this.repo.list(false);
      return active.map((s) => s.id);
    }
    if (user.permissions?.has('store.all')) {
      const all = await this.repo.list(false);
      return all.map((s) => s.id);
    }
    const assignedIds = await this.repo.listForUser(user.id);
    const active = await this.repo.list(false);
    const activeSet = new Set(active.map((s) => s.id));
    return assignedIds.filter((id) => activeSet.has(id));
  }

  /**
   * The header rules (Change 9, ADR 0045):
   * - `X-Store-Id: all` requires `store.all` permission; returns all allowed stores.
   * - `X-Store-Id: <id>` checks if caller is allowed; if not, 403 STORE_FORBIDDEN.
   * - No header: if caller has exactly 1 allowed store, use that store.
   * - No header and multiple allowed: marks pendingMultiple (400 on store-scoped operations).
   */
  async resolveStore(
    user: AuthenticatedUser | undefined,
    headerValue: string | undefined,
  ): Promise<StoreContextSelection> {
    const allowed = await this.allowedStoreIds(user);

    if (headerValue === 'all') {
      if (!user?.permissions?.has('store.all')) {
        throw new ForbiddenException({
          code: STORE_FORBIDDEN,
          message: 'X-Store-Id: all requires the store.all permission',
        });
      }
      return { all: true, storeIds: allowed };
    }

    if (headerValue) {
      if (!allowed.includes(headerValue)) {
        throw new ForbiddenException({
          code: STORE_FORBIDDEN,
          message: `Store ${headerValue} is not allowed for this user`,
        });
      }
      return { all: false, storeIds: [headerValue] };
    }

    if (allowed.length === 0) {
      return { all: false, storeIds: [] };
    }

    if (allowed.length === 1) {
      return { all: false, storeIds: allowed };
    }

    return { all: false, storeIds: allowed, pendingMultiple: true };
  }

  /** The resolved store IDs for the current request. */
  async currentStoreIds(): Promise<string[]> {
    const ctx = getStoreSelection();
    if (ctx) {
      if (ctx.pendingMultiple) {
        throw new BadRequestException({
          code: STORE_REQUIRED,
          message: 'This user works in several stores; send X-Store-Id',
        });
      }
      if (ctx.storeIds.length > 0) return ctx.storeIds;
    }
    const defaultId = await this.repo.currentId();
    return [defaultId];
  }

  /** The single active store for the current request — write resolution point. */
  async currentStoreId(): Promise<string> {
    const ctx = getStoreSelection();
    if (ctx?.pendingMultiple) {
      throw new BadRequestException({
        code: STORE_REQUIRED,
        message: 'This user works in several stores; send X-Store-Id',
      });
    }
    if (ctx?.all || (ctx && ctx.storeIds.length > 1)) {
      throw new BadRequestException({
        code: STORE_ALL,
        message: 'Store-wide is only allowed on read-only endpoints',
      });
    }
    if (ctx && ctx.storeIds.length === 1) {
      return ctx.storeIds[0];
    }
    return this.repo.currentId();
  }

  getIdentity(storeId?: string): Promise<StoreIdentity> {
    return this.repo.getIdentity(storeId);
  }

  async updateIdentity(data: Partial<StoreIdentity>): Promise<void> {
    await this.repo.updateIdentity(await this.currentStoreId(), data);
  }

  list(includeDeactivated = false): Promise<StoreView[]> {
    return this.repo.list(includeDeactivated);
  }

  async get(id: string): Promise<StoreView> {
    const store = await this.repo.findById(id);
    if (!store) throw new NotFoundException(`Store ${id} not found`);
    return store;
  }

  async storesForUser(
    user: AuthenticatedUser | undefined,
  ): Promise<StoreView[]> {
    const ids = await this.allowedStoreIds(user);
    const all = await this.repo.list(false);
    const byId = new Map(all.map((s) => [s.id, s]));
    return ids.map((id) => byId.get(id)!).filter((s): s is StoreView => !!s);
  }

  async create(dto: CreateStoreDto): Promise<StoreView> {
    const store = await this.repo.create(dto);
    await this.repo.createSettings(store.id);
    return store;
  }

  async update(id: string, dto: UpdateStoreDto): Promise<StoreView> {
    await this.get(id);
    return this.repo.update(id, dto);
  }

  async deactivate(id: string): Promise<StoreView> {
    await this.get(id);
    const [devices, qtyStock, openShifts] = await Promise.all([
      this.repo.countDevices(id),
      this.repo.countQuantityStock(id),
      this.repo.countOpenShifts(id),
    ]);

    if (devices > 0 || qtyStock > 0 || openShifts > 0) {
      throw new BadRequestException({
        code: STORE_DEACTIVATE_BLOCKED,
        message: 'A store with stock or an open shift cannot be deactivated',
      });
    }

    return this.repo.update(id, { deactivatedAt: new Date() });
  }

  async setUserStores(userId: string, storeIds: string[]): Promise<void> {
    await this.repo.setUserStores(userId, storeIds);
  }

  async getUserStores(userId: string): Promise<string[]> {
    return this.repo.listForUser(userId);
  }
}
