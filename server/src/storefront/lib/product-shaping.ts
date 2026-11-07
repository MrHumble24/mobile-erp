import { buildImageUrl } from '../../common/lib/image-url.js';
import type { PricingService } from '../../pricing/pricing.service.js';
import type {
  PublicModelRow,
  PublicUnitRow,
} from '../storefront.repository.js';
import type {
  StorefrontProductCard,
  StorefrontProductDetail,
  StorefrontVariant,
  StorefrontVariantStore,
} from '../types/storefront.types.js';
import {
  resolveMinUnitPrice,
  resolveProductPrice,
  type PricesBatchMap,
} from './product-pricing.js';

export type UnitPricesBatchMap = PricesBatchMap;
export type ProductPricesBatchMap = PricesBatchMap;

export function groupUnitsByModel(
  units: PublicUnitRow[],
): Map<string, PublicUnitRow[]> {
  const map = new Map<string, PublicUnitRow[]>();
  for (const u of units) {
    const list = map.get(u.modelId);
    if (list) list.push(u);
    else map.set(u.modelId, [u]);
  }
  return map;
}

export async function buildUnitProductCards(
  models: PublicModelRow[],
  unitsByModel: Map<string, PublicUnitRow[]>,
  storeMap: Map<string, string>,
  showPrices: boolean,
  pricing: PricingService | UnitPricesBatchMap,
): Promise<StorefrontProductCard[]> {
  const cards: StorefrontProductCard[] = [];

  for (const m of models) {
    const mUnits = unitsByModel.get(m.id) ?? [];
    if (mUnits.length === 0) continue;

    const storeCounts = new Map<string, number>();
    for (const u of mUnits)
      storeCounts.set(u.storeId, (storeCounts.get(u.storeId) ?? 0) + 1);
    const availableStores = Array.from(storeCounts.entries())
      .filter(([, count]) => count > 0)
      .map(([id]) => ({ id, name: storeMap.get(id) ?? id }));

    let priceFrom: string | null = null;
    if (showPrices) {
      priceFrom = await resolveMinUnitPrice(m, mUnits, pricing);
    }

    const imageFileName =
      m.imageFileName || m.colorImages?.[0]?.imageFileName || null;

    cards.push({
      modelId: m.id,
      brand: m.brand,
      name: m.name,
      categoryId: m.categoryId,
      categoryName: m.category?.name ?? null,
      imageUrl: buildImageUrl(imageFileName),
      priceFrom,
      inStock: mUnits.length,
      stores: availableStores,
    });
  }

  return cards;
}

export async function buildQuantityProductCards(
  models: PublicModelRow[],
  quantityMap: Map<string, Map<string, number>>,
  storeMap: Map<string, string>,
  showPrices: boolean,
  pricing: PricingService | ProductPricesBatchMap,
): Promise<StorefrontProductCard[]> {
  const cards: StorefrontProductCard[] = [];

  for (const m of models) {
    const mStock = quantityMap.get(m.id);
    if (!mStock) continue;

    let totalStock = 0;
    const availableStores: { id: string; name: string }[] = [];
    for (const [sId, qty] of mStock.entries()) {
      if (qty <= 0) continue;
      totalStock += qty;
      availableStores.push({ id: sId, name: storeMap.get(sId) ?? sId });
    }
    if (totalStock <= 0) continue;

    let priceFrom: string | null = null;
    if (showPrices) {
      priceFrom = await resolveProductPrice(m, pricing);
    }

    const imageFileName =
      m.imageFileName || m.colorImages?.[0]?.imageFileName || null;

    cards.push({
      modelId: m.id,
      brand: m.brand,
      name: m.name,
      categoryId: m.categoryId,
      categoryName: m.category?.name ?? null,
      imageUrl: buildImageUrl(imageFileName),
      priceFrom,
      inStock: totalStock,
      stores: availableStores,
    });
  }

  return cards;
}

interface VariantGroup {
  specs: Record<string, unknown>;
  units: PublicUnitRow[];
  storeCounts: Map<string, number>;
}

function groupUnitsByVariant(
  units: PublicUnitRow[],
): Map<string, VariantGroup> {
  const groups = new Map<string, VariantGroup>();

  for (const u of units) {
    const s =
      u.specs && typeof u.specs === 'object' && !Array.isArray(u.specs)
        ? (u.specs as Record<string, unknown>)
        : {};
    const storage = typeof s.storage === 'string' ? s.storage : '';
    const color = typeof s.color === 'string' ? s.color : '';
    const key = `${storage}|${color}`;

    if (!groups.has(key)) {
      const cleanSpecs: Record<string, string> = {};
      if (storage) cleanSpecs.storage = storage;
      if (color) cleanSpecs.color = color;
      groups.set(key, { specs: cleanSpecs, units: [], storeCounts: new Map() });
    }
    const grp = groups.get(key)!;
    grp.units.push(u);
    grp.storeCounts.set(u.storeId, (grp.storeCounts.get(u.storeId) ?? 0) + 1);
  }

  return groups;
}

function extractColorImages(model: PublicModelRow): Record<string, string> {
  const map: Record<string, string> = {};
  if (Array.isArray(model.colorImages)) {
    for (const item of model.colorImages) {
      const url = buildImageUrl(item.imageFileName);
      if (url) map[item.color] = url;
    }
  }
  return map;
}

export async function buildUnitProductDetail(
  model: PublicModelRow,
  units: PublicUnitRow[],
  storeMap: Map<string, string>,
  showPrices: boolean,
  pricing: PricingService | UnitPricesBatchMap,
): Promise<StorefrontProductDetail> {
  const variantGroups = groupUnitsByVariant(units);
  const variants: StorefrontVariant[] = [];
  const allStoreCounts = new Map<string, number>();
  let minPrice: number | null = null;

  for (const grp of variantGroups.values()) {
    const vStores: StorefrontVariantStore[] = [];
    for (const [sId, cnt] of grp.storeCounts.entries()) {
      if (cnt <= 0) continue;
      vStores.push({ id: sId, name: storeMap.get(sId) ?? sId, count: cnt });
      allStoreCounts.set(sId, (allStoreCounts.get(sId) ?? 0) + cnt);
    }

    let price: string | null = null;
    if (showPrices) {
      price = await resolveMinUnitPrice(model, grp.units, pricing);
      if (price !== null) {
        const num = Number(price);
        if (minPrice === null || num < minPrice) minPrice = num;
      }
    }

    variants.push({
      specs: grp.specs,
      price,
      count: grp.units.length,
      stores: vStores,
    });
  }

  const cardStores = Array.from(allStoreCounts.entries())
    .filter(([, cnt]) => cnt > 0)
    .map(([id]) => ({ id, name: storeMap.get(id) ?? id }));

  return {
    modelId: model.id,
    brand: model.brand,
    name: model.name,
    categoryId: model.categoryId,
    categoryName: model.category?.name ?? null,
    imageUrl: buildImageUrl(model.imageFileName),
    colorImages: extractColorImages(model),
    priceFrom: minPrice !== null ? minPrice.toFixed(2) : null,
    inStock: units.length,
    stores: cardStores,
    variants,
  };
}

export async function buildQuantityProductDetail(
  model: PublicModelRow,
  mStock: Map<string, number> | undefined,
  storeMap: Map<string, string>,
  showPrices: boolean,
  pricing: PricingService | ProductPricesBatchMap,
): Promise<StorefrontProductDetail> {
  let totalStock = 0;
  const vStores: StorefrontVariantStore[] = [];
  const cardStores: { id: string; name: string }[] = [];

  if (mStock) {
    for (const [sId, qty] of mStock.entries()) {
      if (qty <= 0) continue;
      totalStock += qty;
      const name = storeMap.get(sId) ?? sId;
      vStores.push({ id: sId, name, count: qty });
      cardStores.push({ id: sId, name });
    }
  }

  let price: string | null = null;
  if (showPrices) {
    price = await resolveProductPrice(model, pricing);
  }

  const variant: StorefrontVariant = {
    specs: {},
    price,
    count: totalStock,
    stores: vStores,
  };

  return {
    modelId: model.id,
    brand: model.brand,
    name: model.name,
    categoryId: model.categoryId,
    categoryName: model.category?.name ?? null,
    imageUrl: buildImageUrl(model.imageFileName),
    colorImages: extractColorImages(model),
    priceFrom: price,
    inStock: totalStock,
    stores: cardStores,
    variants: [variant],
  };
}
