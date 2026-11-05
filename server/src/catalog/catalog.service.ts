import { Injectable } from '@nestjs/common';
import { buildImageUrl } from '../common/lib/image-url.js';
import { PricingService } from '../pricing/pricing.service.js';
import type { ResolvedPrices } from '../pricing/types/pricing.types.js';
import { StoresService } from '../stores/stores.service.js';
import { CatalogRepository } from './catalog.repository.js';
import type {
  CatalogEntry,
  CatalogUnit,
  QuantityProductRow,
  UnitProductRow,
  UnitRow,
} from './types/catalog.types.js';

interface CatalogQuery {
  categoryId?: string;
  search?: string;
}

/**
 * The read model behind the till's product grid (ADR 0031). One list of product
 * cards (IMEI/SERIAL products with stock + active QUANTITY products) and one
 * list of a product's in-stock units. Target/sale prices are sale-side, not
 * cost, so nothing here is redacted.
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly repo: CatalogRepository,
    private readonly stores: StoresService,
    private readonly pricing: PricingService,
  ) {}

  async list(query: CatalogQuery): Promise<CatalogEntry[]> {
    const storeId = await this.stores.currentStoreId();
    const [units, quantities] = await Promise.all([
      this.repo.unitProducts(storeId, query.categoryId, query.search),
      this.repo.quantityProducts(storeId, query.categoryId, query.search),
    ]);
    const entries = [
      ...units.map(unitProductToEntry),
      ...quantities.map(quantityProductToEntry),
    ];
    // Card prices are the product-level list price per level at "any storage";
    // per-unit prices are resolved in `units()` after a card is tapped.
    const priceMap = await this.pricing.pricesForProducts([
      ...units.map((u) => ({
        modelId: u.modelId,
        storage: '',
        salePrice: null,
      })),
      ...quantities.map((q) => ({
        modelId: q.modelId,
        storage: '',
        salePrice: q.salePrice,
      })),
    ]);
    for (const e of entries) e.prices = priceMap.get(e.modelId) ?? {};
    entries.sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    );
    return entries;
  }

  async units(modelId: string): Promise<CatalogUnit[]> {
    const storeId = await this.stores.currentStoreId();
    const rows = await this.repo.sellableUnits(storeId, modelId);
    const priceMap = await this.pricing.pricesForUnits(
      rows.map((r) => ({
        deviceId: r.id,
        modelId,
        storage: storageOf(r.specs),
        targetPrice: r.targetPrice,
        salePrice: null,
      })),
    );
    return rows.map((r) => unitToView(r, priceMap.get(r.id) ?? {}));
  }
}

function storageOf(specs: unknown): string {
  if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
    const value = (specs as Record<string, unknown>).storage;
    if (typeof value === 'string') return value;
  }
  return '';
}

function unitProductToEntry(row: UnitProductRow): CatalogEntry {
  return {
    modelId: row.modelId,
    brand: row.brand,
    name: row.name,
    kindCode: row.kindCode,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    imageUrl: buildImageUrl(row.imageFileName),
    inStock: Number(row.inStock),
    minTargetPrice:
      row.minTargetPrice === null ? null : row.minTargetPrice.toFixed(2),
    maxTargetPrice:
      row.maxTargetPrice === null ? null : row.maxTargetPrice.toFixed(2),
    salePrice: null,
    prices: {},
  };
}

function quantityProductToEntry(row: QuantityProductRow): CatalogEntry {
  return {
    modelId: row.modelId,
    brand: row.brand,
    name: row.name,
    kindCode: row.kindCode,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    imageUrl: buildImageUrl(row.imageFileName),
    inStock: Number(row.quantity),
    minTargetPrice: null,
    maxTargetPrice: null,
    salePrice: row.salePrice === null ? null : row.salePrice.toFixed(2),
    prices: {},
  };
}

function unitToView(row: UnitRow, prices: ResolvedPrices): CatalogUnit {
  return {
    id: row.id,
    code: row.imei ?? row.serialNumber,
    specs: row.specs,
    gradeCode: row.gradeCode,
    targetPrice: row.targetPrice === null ? null : row.targetPrice.toFixed(2),
    prices,
  };
}
