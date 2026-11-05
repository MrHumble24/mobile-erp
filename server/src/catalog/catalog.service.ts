import { Injectable } from '@nestjs/common';
import { buildImageUrl } from '../common/lib/image-url.js';
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
    entries.sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    );
    return entries;
  }

  async units(modelId: string): Promise<CatalogUnit[]> {
    const storeId = await this.stores.currentStoreId();
    const rows = await this.repo.sellableUnits(storeId, modelId);
    return rows.map(unitToView);
  }
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
  };
}

function unitToView(row: UnitRow): CatalogUnit {
  return {
    id: row.id,
    code: row.imei ?? row.serialNumber,
    specs: row.specs,
    gradeCode: row.gradeCode,
    targetPrice: row.targetPrice === null ? null : row.targetPrice.toFixed(2),
  };
}
