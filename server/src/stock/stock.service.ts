import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PricingService } from '../pricing/pricing.service.js';
import { StoresService } from '../stores/stores.service.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { averageCost, type StockAggregate } from './lib/stock-math.js';
import { toLevelView, toMovementView } from './lib/stock-view.js';
import { StockRepository } from './stock.repository.js';
import type {
  QuantityProductView,
  ShipmentStockLine,
  StockLevelView,
  StockMovementInput,
  StockMovementsPage,
} from './types/stock.types.js';

type Tx = Prisma.TransactionClient;

/**
 * Quantity-product stock (ADR 0030). Stock is an append-only movement log; a
 * product's quantity, value and moving-average cost are summed from it, never
 * stored. `aggregate`/`averageCost`/`postMovement` are tx-aware primitives that
 * `sales` (SALE/RETURN) and `shipments` (PURCHASE) call inside their own
 * transaction so stock and the sale/purchase commit atomically.
 */
@Injectable()
export class StockService {
  constructor(
    private readonly repo: StockRepository,
    private readonly stores: StoresService,
    private readonly pricing: PricingService,
  ) {}

  async list(
    caller: AuthenticatedUser,
    query: { categoryId?: string; search?: string },
  ): Promise<StockLevelView[]> {
    const storeId = await this.stores.currentStoreId();
    const rows = await this.repo.listStock(
      storeId,
      query.categoryId,
      query.search,
    );
    const canViewCost = caller.permissions.has('device.cost.view');
    const priceMap = await this.pricing.pricesForProducts(
      rows.map((r) => ({
        modelId: r.modelId,
        storage: '',
        salePrice: r.salePrice,
      })),
    );
    return rows.map((r) =>
      toLevelView(r, canViewCost, priceMap.get(r.modelId) ?? {}),
    );
  }

  async movements(
    caller: AuthenticatedUser,
    modelId: string,
    page = 1,
    pageSize = 50,
  ): Promise<StockMovementsPage> {
    const storeId = await this.stores.currentStoreId();
    const { items, total } = await this.repo.listMovements(
      storeId,
      modelId,
      page,
      pageSize,
    );
    const canViewCost = caller.permissions.has('device.cost.view');
    return {
      items: items.map((m) => toMovementView(m, canViewCost)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Write-off (removes pieces, note required) or count correction (client sends
   * the counted quantity, server writes the signed difference). Neither moves
   * money. A zero difference writes nothing (a movement is never zero).
   */
  async adjust(
    caller: AuthenticatedUser,
    dto: AdjustStockDto,
  ): Promise<StockLevelView> {
    await this.assertQuantityModel(dto.modelId);
    const storeId = await this.stores.currentStoreId();
    const agg = await this.repo.aggregate(storeId, dto.modelId);
    const cost = averageCost(agg);
    if (dto.type === 'WRITE_OFF') {
      await this.writeOff(dto, storeId, cost, caller.id);
    } else {
      await this.correctCount(dto, storeId, agg, cost, caller.id);
    }
    return this.levelFor(caller, storeId, dto.modelId);
  }

  private async writeOff(
    dto: AdjustStockDto,
    storeId: string,
    cost: Prisma.Decimal,
    userId: string,
  ): Promise<void> {
    if (!dto.quantity) {
      throw new BadRequestException('A write-off needs a quantity');
    }
    if (!dto.note?.trim()) {
      throw new BadRequestException('A write-off needs a note');
    }
    await this.repo.create({
      storeId,
      modelId: dto.modelId,
      typeCode: 'WRITE_OFF',
      quantity: -dto.quantity,
      unitCostSnapshot: cost,
      note: dto.note.trim(),
      createdById: userId,
    });
  }

  private async correctCount(
    dto: AdjustStockDto,
    storeId: string,
    agg: StockAggregate,
    cost: Prisma.Decimal,
    userId: string,
  ): Promise<void> {
    if (dto.countedQuantity === undefined) {
      throw new BadRequestException(
        'A count correction needs the counted quantity',
      );
    }
    const diff = dto.countedQuantity - agg.quantity;
    if (diff === 0) return; // nothing changed — a movement is never zero
    await this.repo.create({
      storeId,
      modelId: dto.modelId,
      typeCode: 'COUNT_CORRECTION',
      quantity: diff,
      unitCostSnapshot: cost,
      note: dto.note?.trim() || undefined,
      createdById: userId,
    });
  }

  // --- primitives for sales (SALE/RETURN) and shipments (PURCHASE) ----------

  aggregate(
    storeId: string,
    modelId: string,
    tx?: Tx,
  ): Promise<StockAggregate> {
    return this.repo.aggregate(storeId, modelId, tx);
  }

  async averageCost(
    storeId: string,
    modelId: string,
    tx?: Tx,
  ): Promise<Prisma.Decimal> {
    return averageCost(await this.repo.aggregate(storeId, modelId, tx));
  }

  postMovement(input: StockMovementInput, tx?: Tx) {
    return this.repo.create(input, tx);
  }

  // --- reads for scan + sync + reports --------------------------------------

  async findByBarcode(
    barcode: string,
    storeId?: string,
  ): Promise<QuantityProductView | null> {
    const product = await this.repo.findByBarcode(
      storeId ?? (await this.stores.currentStoreId()),
      barcode,
    );
    if (!product) return null;
    return (await this.attachProductPrices([product]))[0];
  }

  async productsForFeed(storeId: string): Promise<QuantityProductView[]> {
    return this.attachProductPrices(
      await this.repo.quantityProductsForFeed(storeId),
    );
  }

  /** Resolve each product's list price per level (ADR 0034). */
  private async attachProductPrices(
    products: QuantityProductView[],
  ): Promise<QuantityProductView[]> {
    const map = await this.pricing.pricesForProducts(
      products.map((p) => ({
        modelId: p.modelId,
        storage: '',
        salePrice:
          p.salePrice === null ? null : new Prisma.Decimal(p.salePrice),
      })),
    );
    return products.map((p) => ({ ...p, prices: map.get(p.modelId) ?? {} }));
  }

  /** Total quantity-stock value for the inventory report (all stores). */
  totalStockValue(): Promise<Prisma.Decimal> {
    return this.repo.totalStockValue();
  }

  /** A shipment's quantity PURCHASE lines (newest last). For shipment detail. */
  shipmentPurchaseLines(shipmentId: string): Promise<ShipmentStockLine[]> {
    return this.repo.shipmentPurchaseLines(shipmentId);
  }

  /** Σ purchase line totals per shipment, for the shipment list/detail totals. */
  purchaseTotalsByShipment(
    shipmentIds: string[],
  ): Promise<Map<string, Prisma.Decimal>> {
    return this.repo.purchaseTotalsByShipment(shipmentIds);
  }

  /** 400 unless the model exists and is a QUANTITY product. */
  async assertQuantityModel(modelId: string): Promise<void> {
    const kind = await this.repo.modelKind(modelId);
    if (kind === null) {
      throw new BadRequestException(`Product ${modelId} not found`);
    }
    if (kind !== 'QUANTITY') {
      throw new BadRequestException(
        `Product ${modelId} is a ${kind} product, not a quantity product`,
      );
    }
  }

  private async levelFor(
    caller: AuthenticatedUser,
    storeId: string,
    modelId: string,
  ): Promise<StockLevelView> {
    const [row] = await this.repo
      .listStock(storeId, undefined, undefined)
      .then((rows) => rows.filter((r) => r.modelId === modelId));
    const priceMap = await this.pricing.pricesForProducts([
      { modelId: row.modelId, storage: '', salePrice: row.salePrice },
    ]);
    return toLevelView(
      row,
      caller.permissions.has('device.cost.view'),
      priceMap.get(row.modelId) ?? {},
    );
  }
}
