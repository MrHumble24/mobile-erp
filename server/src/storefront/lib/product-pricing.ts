import type { PricingService } from '../../pricing/pricing.service.js';
import type { ResolvedPrices } from '../../pricing/types/pricing.types.js';
import type {
  PublicModelRow,
  PublicUnitRow,
} from '../storefront.repository.js';

export type PricesBatchMap = Map<string, ResolvedPrices>;

export function toUnitContext(u: PublicUnitRow) {
  const s =
    u.specs && typeof u.specs === 'object' && !Array.isArray(u.specs)
      ? (u.specs as Record<string, unknown>).storage
      : '';
  return {
    deviceId: u.id,
    modelId: u.modelId,
    storage: typeof s === 'string' ? s : '',
    targetPrice: u.targetPrice,
    salePrice: null,
  };
}

export async function resolveMinUnitPrice(
  model: PublicModelRow,
  units: PublicUnitRow[],
  pricing: PricingService | PricesBatchMap,
): Promise<string | null> {
  let min: number | null = null;
  if (pricing instanceof Map) {
    for (const u of units) {
      const p = pricing.get(u.id)?.['RETAIL'];
      if (p !== null && p !== undefined) {
        const val = Number(p);
        if (min === null || val < min) min = val;
      }
    }
  } else {
    for (const u of units) {
      const ctx = toUnitContext(u);
      const price = await pricing.listPriceForUnit('RETAIL', {
        deviceId: u.id,
        modelId: model.id,
        storage: ctx.storage,
        targetPrice: u.targetPrice,
        salePrice: null,
      });
      if (price !== null) {
        const val = Number(price);
        if (min === null || val < min) min = val;
      }
    }
  }
  return min !== null ? min.toFixed(2) : null;
}

export async function resolveProductPrice(
  model: PublicModelRow,
  pricing: PricingService | PricesBatchMap,
): Promise<string | null> {
  if (pricing instanceof Map) {
    const p = pricing.get(model.id)?.['RETAIL'];
    return p !== null && p !== undefined ? Number(p).toFixed(2) : null;
  }
  const resolved = await pricing.listPriceForProduct('RETAIL', {
    modelId: model.id,
    storage: '',
    salePrice: model.salePrice,
  });
  return resolved ? resolved.toFixed(2) : null;
}

const emptyMap = (): PricesBatchMap => new Map<string, ResolvedPrices>();

export async function resolveCatalogPrices(
  pricing: PricingService,
  showPrices: boolean,
  units: PublicUnitRow[],
  qtyModels: PublicModelRow[],
): Promise<{ unitPrices: PricesBatchMap; productPrices: PricesBatchMap }> {
  if (!showPrices) {
    return { unitPrices: emptyMap(), productPrices: emptyMap() };
  }
  const [unitPrices, productPrices] = await Promise.all([
    units.length > 0
      ? pricing.pricesForUnits(units.map(toUnitContext))
      : Promise.resolve(emptyMap()),
    qtyModels.length > 0
      ? pricing.pricesForProducts(
          qtyModels.map((m) => ({
            modelId: m.id,
            storage: '',
            salePrice: m.salePrice,
          })),
        )
      : Promise.resolve(emptyMap()),
  ]);
  return { unitPrices, productPrices };
}
