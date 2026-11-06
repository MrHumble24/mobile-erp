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

export async function buildUnitProductCards(
  models: PublicModelRow[],
  unitsByModel: Map<string, PublicUnitRow[]>,
  storeMap: Map<string, string>,
  showPrices: boolean,
  pricing: PricingService,
): Promise<StorefrontProductCard[]> {
  const cards: StorefrontProductCard[] = [];

  for (const m of models) {
    const mUnits = unitsByModel.get(m.id) ?? [];
    if (mUnits.length === 0) continue;

    const storeCounts = new Map<string, number>();
    for (const u of mUnits) {
      storeCounts.set(u.storeId, (storeCounts.get(u.storeId) ?? 0) + 1);
    }

    const availableStores = Array.from(storeCounts.entries())
      .filter(([, count]) => count > 0)
      .map(([id]) => ({ id, name: storeMap.get(id) ?? id }));

    let priceFrom: string | null = null;
    if (showPrices) {
      priceFrom = await resolveMinUnitPrice(m, mUnits, pricing);
    }

    cards.push({
      modelId: m.id,
      brand: m.brand,
      name: m.name,
      categoryId: m.categoryId,
      categoryName: m.category?.name ?? null,
      imageUrl: buildImageUrl(m.imageFileName),
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
  pricing: PricingService,
): Promise<StorefrontProductCard[]> {
  const cards: StorefrontProductCard[] = [];

  for (const m of models) {
    const mStock = quantityMap.get(m.id);
    if (!mStock) continue;

    let totalStock = 0;
    const availableStores: { id: string; name: string }[] = [];
    for (const [sId, qty] of mStock.entries()) {
      if (qty > 0) {
        totalStock += qty;
        availableStores.push({ id: sId, name: storeMap.get(sId) ?? sId });
      }
    }
    if (totalStock <= 0) continue;

    let priceFrom: string | null = null;
    if (showPrices) {
      const resolved = await pricing.listPriceForProduct('RETAIL', {
        modelId: m.id,
        storage: '',
        salePrice: m.salePrice,
      });
      priceFrom = resolved ? resolved.toFixed(2) : null;
    }

    cards.push({
      modelId: m.id,
      brand: m.brand,
      name: m.name,
      categoryId: m.categoryId,
      categoryName: m.category?.name ?? null,
      imageUrl: buildImageUrl(m.imageFileName),
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
    const specsObj =
      u.specs && typeof u.specs === 'object' && !Array.isArray(u.specs)
        ? (u.specs as Record<string, unknown>)
        : {};
    const storage =
      typeof specsObj.storage === 'string' ? specsObj.storage : '';
    const color = typeof specsObj.color === 'string' ? specsObj.color : '';
    const key = `${storage}|${color}`;

    if (!groups.has(key)) {
      const cleanSpecs: Record<string, unknown> = {};
      if (storage) cleanSpecs.storage = storage;
      if (color) cleanSpecs.color = color;
      groups.set(key, {
        specs: cleanSpecs,
        units: [],
        storeCounts: new Map(),
      });
    }
    const grp = groups.get(key)!;
    grp.units.push(u);
    grp.storeCounts.set(u.storeId, (grp.storeCounts.get(u.storeId) ?? 0) + 1);
  }

  return groups;
}

export async function buildUnitProductDetail(
  model: PublicModelRow,
  units: PublicUnitRow[],
  storeMap: Map<string, string>,
  showPrices: boolean,
  pricing: PricingService,
): Promise<StorefrontProductDetail> {
  const variantGroups = groupUnitsByVariant(units);
  const variants: StorefrontVariant[] = [];
  const allStoreCounts = new Map<string, number>();
  let minPrice: number | null = null;

  for (const grp of variantGroups.values()) {
    const vStores: StorefrontVariantStore[] = [];
    for (const [sId, cnt] of grp.storeCounts.entries()) {
      if (cnt > 0) {
        vStores.push({ id: sId, name: storeMap.get(sId) ?? sId, count: cnt });
        allStoreCounts.set(sId, (allStoreCounts.get(sId) ?? 0) + cnt);
      }
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
  pricing: PricingService,
): Promise<StorefrontProductDetail> {
  let totalStock = 0;
  const vStores: StorefrontVariantStore[] = [];
  const cardStores: { id: string; name: string }[] = [];

  if (mStock) {
    for (const [sId, qty] of mStock.entries()) {
      if (qty > 0) {
        totalStock += qty;
        const name = storeMap.get(sId) ?? sId;
        vStores.push({ id: sId, name, count: qty });
        cardStores.push({ id: sId, name });
      }
    }
  }

  let price: string | null = null;
  if (showPrices) {
    const resolved = await pricing.listPriceForProduct('RETAIL', {
      modelId: model.id,
      storage: '',
      salePrice: model.salePrice,
    });
    price = resolved ? resolved.toFixed(2) : null;
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
    priceFrom: price,
    inStock: totalStock,
    stores: cardStores,
    variants: [variant],
  };
}

async function resolveMinUnitPrice(
  model: PublicModelRow,
  units: PublicUnitRow[],
  pricing: PricingService,
): Promise<string | null> {
  let min: number | null = null;
  for (const u of units) {
    const rawStorage =
      u.specs && typeof u.specs === 'object' && !Array.isArray(u.specs)
        ? (u.specs as Record<string, unknown>).storage
        : undefined;
    const storage = typeof rawStorage === 'string' ? rawStorage : '';

    const price = await pricing.listPriceForUnit('RETAIL', {
      deviceId: u.id,
      modelId: model.id,
      storage,
      targetPrice: u.targetPrice,
      salePrice: null,
    });

    if (price !== null) {
      const val = Number(price);
      if (min === null || val < min) min = val;
    }
  }
  return min !== null ? min.toFixed(2) : null;
}
