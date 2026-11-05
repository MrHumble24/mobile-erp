import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { SetProductPricesDto } from './dto/set-product-prices.dto.js';
import { SetUnitPricesDto } from './dto/set-unit-prices.dto.js';
import {
  ANY_STORAGE,
  productKey,
  resolveAllLevels,
  resolveListPrice,
  type PriceInputs,
} from './lib/price-resolution.js';
import {
  PricingRepository,
  type ProductPriceRow,
  type ProductPriceWrite,
  type UnitPriceRow,
  type UnitPriceWrite,
} from './pricing.repository.js';
import type {
  PriceLevelView,
  ProductPriceContext,
  ProductPricesView,
  ResolvedPrices,
  UnitPriceContext,
  UnitPricesView,
} from './types/pricing.types.js';

type Decimal = Prisma.Decimal;

/**
 * Price levels and list-price resolution (Change 12, ADR 0034). The single
 * source for "what does this unit/product cost at level X" and for the
 * price-manage screen. Other modules inject this service, never the repository.
 */
@Injectable()
export class PricingService {
  constructor(private readonly repo: PricingRepository) {}

  getActiveLevels(): Promise<PriceLevelView[]> {
    return this.repo.activeLevels();
  }

  private async levelCodes(): Promise<string[]> {
    return (await this.repo.activeLevels()).map((l) => l.code);
  }

  /** 400 unless `code` is an active price level. */
  async assertLevel(code: string): Promise<void> {
    if (!(await this.repo.levelExists(code))) {
      throw new BadRequestException(`Unknown or inactive price level ${code}`);
    }
  }

  /** One unit's list price at a level (null = no price set). */
  async listPriceForUnit(
    level: string,
    ctx: UnitPriceContext,
  ): Promise<Decimal | null> {
    const [unitRows, productRows] = await Promise.all([
      this.repo.unitPrices(ctx.deviceId),
      this.repo.productPrices(ctx.modelId),
    ]);
    return resolveListPrice(
      level,
      ctx.storage,
      this.unitInputs(ctx, unitRows, productRows),
    );
  }

  /** One quantity/serial product's list price per piece at a level. */
  async listPriceForProduct(
    level: string,
    ctx: ProductPriceContext,
  ): Promise<Decimal | null> {
    const productRows = await this.repo.productPrices(ctx.modelId);
    return resolveListPrice(
      level,
      ctx.storage,
      this.productInputs(ctx.salePrice, productRows),
    );
  }

  /** Resolve every level for a batch of units (for read enrichment). */
  async pricesForUnits(
    ctxs: UnitPriceContext[],
  ): Promise<Map<string, ResolvedPrices>> {
    const out = new Map<string, ResolvedPrices>();
    if (ctxs.length === 0) return out;
    const levels = await this.levelCodes();
    const [unitMap, productMap] = await Promise.all([
      this.repo.unitPricesByDevice(ctxs.map((c) => c.deviceId)),
      this.repo.productPricesByModel(unique(ctxs.map((c) => c.modelId))),
    ]);
    for (const ctx of ctxs) {
      const inputs = this.unitInputs(
        ctx,
        unitMap.get(ctx.deviceId) ?? [],
        productMap.get(ctx.modelId) ?? [],
      );
      out.set(ctx.deviceId, resolveAllLevels(levels, ctx.storage, inputs));
    }
    return out;
  }

  /** Resolve every level for a batch of products (keyed by modelId). */
  async pricesForProducts(
    ctxs: ProductPriceContext[],
  ): Promise<Map<string, ResolvedPrices>> {
    const out = new Map<string, ResolvedPrices>();
    if (ctxs.length === 0) return out;
    const levels = await this.levelCodes();
    const productMap = await this.repo.productPricesByModel(
      unique(ctxs.map((c) => c.modelId)),
    );
    for (const ctx of ctxs) {
      const inputs = this.productInputs(
        ctx.salePrice,
        productMap.get(ctx.modelId) ?? [],
      );
      out.set(ctx.modelId, resolveAllLevels(levels, ctx.storage, inputs));
    }
    return out;
  }

  // --- price-manage CRUD ------------------------------------------------------

  async getProductPrices(modelId: string): Promise<ProductPricesView> {
    const product = await this.repo.product(modelId);
    if (!product) throw new NotFoundException(`Product ${modelId} not found`);
    const rows = await this.repo.productPrices(modelId);
    const prices = rows.map((r) => ({
      storage: r.storage === ANY_STORAGE ? null : r.storage,
      levelCode: r.levelCode,
      price: r.price.toFixed(2),
    }));
    if (product.salePrice !== null) {
      prices.unshift({
        storage: null,
        levelCode: 'RETAIL',
        price: product.salePrice.toFixed(2),
      });
    }
    return { modelId, kindCode: product.kindCode, prices };
  }

  async setProductPrices(
    modelId: string,
    dto: SetProductPricesDto,
  ): Promise<ProductPricesView> {
    const product = await this.repo.product(modelId);
    if (!product) throw new NotFoundException(`Product ${modelId} not found`);
    const writes: ProductPriceWrite[] = [];
    for (const p of dto.prices) {
      await this.assertLevel(p.levelCode);
      writes.push({
        storage: p.storage?.trim() || ANY_STORAGE,
        levelCode: p.levelCode,
        price: p.price === null ? null : new Prisma.Decimal(p.price),
      });
    }
    await this.repo.writeProductPrices(modelId, writes);
    return this.getProductPrices(modelId);
  }

  async getUnitPrices(deviceId: string): Promise<UnitPricesView> {
    const unit = await this.repo.unit(deviceId);
    if (!unit) throw new NotFoundException(`Unit ${deviceId} not found`);
    const rows = await this.repo.unitPrices(deviceId);
    const prices = rows.map((r) => ({
      levelCode: r.levelCode,
      price: r.price.toFixed(2),
    }));
    if (unit.targetPrice !== null) {
      prices.unshift({
        levelCode: 'RETAIL',
        price: unit.targetPrice.toFixed(2),
      });
    }
    return { deviceId, prices };
  }

  async setUnitPrices(
    deviceId: string,
    dto: SetUnitPricesDto,
  ): Promise<UnitPricesView> {
    const unit = await this.repo.unit(deviceId);
    if (!unit) throw new NotFoundException(`Unit ${deviceId} not found`);
    const writes: UnitPriceWrite[] = [];
    for (const p of dto.prices) {
      await this.assertLevel(p.levelCode);
      writes.push({
        levelCode: p.levelCode,
        price: p.price === null ? null : new Prisma.Decimal(p.price),
      });
    }
    await this.repo.writeUnitPrices(deviceId, writes);
    return this.getUnitPrices(deviceId);
  }

  // --- input builders ---------------------------------------------------------

  private unitInputs(
    ctx: { targetPrice: Decimal | null; salePrice: Decimal | null },
    unitRows: UnitPriceRow[],
    productRows: ProductPriceRow[],
  ): PriceInputs {
    const own = new Map<string, Decimal>();
    for (const r of unitRows) {
      if (r.levelCode !== 'RETAIL') own.set(r.levelCode, r.price);
    }
    if (ctx.targetPrice !== null) own.set('RETAIL', ctx.targetPrice);
    return { own, product: this.productMap(ctx.salePrice, productRows) };
  }

  private productInputs(
    salePrice: Decimal | null,
    productRows: ProductPriceRow[],
  ): PriceInputs {
    return { own: new Map(), product: this.productMap(salePrice, productRows) };
  }

  private productMap(
    salePrice: Decimal | null,
    rows: ProductPriceRow[],
  ): Map<string, Decimal> {
    const product = new Map<string, Decimal>();
    for (const r of rows)
      product.set(productKey(r.storage, r.levelCode), r.price);
    const retailAny = productKey(ANY_STORAGE, 'RETAIL');
    if (salePrice !== null && !product.has(retailAny)) {
      product.set(retailAny, salePrice);
    }
    return product;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
