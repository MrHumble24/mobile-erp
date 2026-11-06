import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PartnersService } from '../partners/partners.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { ChangesQueryDto } from './dto/changes.query.dto.js';
import { SyncChangesRepository } from './sync-changes.repository.js';
import type {
  ChangesResponse,
  DeviceChange,
  PartnerChange,
} from './types/sync.types.js';

/**
 * Builds the offline-cache feed: changed devices, active partners, and every
 * quantity product with its current stock so an offline till can sell them.
 */
@Injectable()
export class SyncChangesService {
  constructor(
    private readonly repo: SyncChangesRepository,
    private readonly partners: PartnersService,
    private readonly stock: StockService,
    private readonly stores: StoresService,
    private readonly pricing: PricingService,
  ) {}

  async changes(
    caller: AuthenticatedUser,
    query: ChangesQueryDto,
  ): Promise<ChangesResponse> {
    const since = query.since ? new Date(query.since) : new Date(0);
    // Partner balances (creditLimit/outstanding) require partner.read; device
    // terminals without it get an empty partners block, not every partner's debt.
    const canReadPartners = caller.permissions.has('partner.read');
    const storeId = await this.stores.currentStoreId();
    const [devices, partners, products] = await Promise.all([
      this.repo.devicesSince(since, storeId),
      canReadPartners
        ? this.partners.list()
        : Promise.resolve<Awaited<ReturnType<PartnersService['list']>>>([]),
      this.stock.productsForFeed(storeId),
    ]);
    // ponytail: cursor skips devices sharing the last millisecond; acceptable at
    // bazaar scale (a few thousand units). Switch to (updatedAt, id) if it bites.
    const capped = devices.length === this.repo.pageSize;
    return {
      serverTime: new Date().toISOString(),
      nextSince: capped
        ? devices[devices.length - 1].updatedAt.toISOString()
        : null,
      devices: await this.withPrices(devices),
      partners: partners.filter((p) => p.isActive).map(toPartnerChange),
      products,
    };
  }

  /** Resolve each changed unit's list price per level (ADR 0034). */
  private async withPrices(devices: DeviceChange[]): Promise<DeviceChange[]> {
    const map = await this.pricing.pricesForUnits(
      devices.map((d) => ({
        deviceId: d.id,
        modelId: d.model.id,
        storage: storageOf(d.specs),
        targetPrice:
          d.targetPrice === null ? null : new Prisma.Decimal(d.targetPrice),
        salePrice: null,
      })),
    );
    return devices.map((d) => ({ ...d, prices: map.get(d.id) ?? {} }));
  }
}

function storageOf(specs: unknown): string {
  if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
    const value = (specs as Record<string, unknown>).storage;
    if (typeof value === 'string') return value;
  }
  return '';
}

function toPartnerChange(p: {
  id: string;
  shopName: string;
  phone: string | null;
  creditLimit: { toFixed: (n: number) => string };
  outstanding: { toFixed: (n: number) => string };
}): PartnerChange {
  return {
    id: p.id,
    shopName: p.shopName,
    phone: p.phone,
    creditLimit: p.creditLimit.toFixed(2),
    outstanding: p.outstanding.toFixed(2),
  };
}
