import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { StoresService } from '../stores/stores.service.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import {
  averageCost,
  valuation,
  type StockAggregate,
} from './lib/stock-math.js';
import { StockRepository } from './stock.repository.js';
import type {
  QuantityProductView,
  StockLevelRow,
  StockLevelView,
  StockMovementInput,
  StockMovementView,
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
    return rows.map((r) => toLevelView(r, canViewCost));
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
    return this.repo.findByBarcode(
      storeId ?? (await this.stores.currentStoreId()),
      barcode,
    );
  }

  async productsForFeed(storeId: string): Promise<QuantityProductView[]> {
    return this.repo.quantityProductsForFeed(storeId);
  }

  /** Total quantity-stock value for the inventory report (all stores). */
  totalStockValue(): Promise<Prisma.Decimal> {
    return this.repo.totalStockValue();
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
    return toLevelView(row, caller.permissions.has('device.cost.view'));
  }
}

function toLevelView(row: StockLevelRow, canViewCost: boolean): StockLevelView {
  const v = valuation({
    quantity: Number(row.quantity),
    value: new Prisma.Decimal(row.value),
    latestPurchaseCost: new Prisma.Decimal(row.latestPurchaseCost),
  });
  return {
    modelId: row.modelId,
    brand: row.brand,
    name: row.name,
    barcode: row.barcode,
    modelCode: row.modelCode,
    categoryId: row.categoryId,
    salePrice:
      row.salePrice === null
        ? null
        : new Prisma.Decimal(row.salePrice).toFixed(2),
    quantity: v.quantity,
    averageCost: canViewCost ? v.averageCost.toFixed(2) : null,
    value: canViewCost ? v.value.toFixed(2) : null,
  };
}

interface MovementRow {
  id: string;
  quantity: number;
  unitCostSnapshot: Prisma.Decimal;
  shipmentId: string | null;
  saleId: string | null;
  note: string | null;
  occurredAt: Date;
  type: { code: string; label: string };
  createdBy: {
    id: string;
    profile: { firstName: string; lastName: string | null } | null;
  } | null;
}

function toMovementView(
  m: MovementRow,
  canViewCost: boolean,
): StockMovementView {
  const p = m.createdBy?.profile;
  return {
    id: m.id,
    typeCode: m.type.code,
    typeLabel: m.type.label,
    quantity: m.quantity,
    unitCostSnapshot: canViewCost ? m.unitCostSnapshot.toFixed(2) : null,
    shipmentId: m.shipmentId,
    saleId: m.saleId,
    note: m.note,
    occurredAt: m.occurredAt,
    createdBy: m.createdBy
      ? {
          id: m.createdBy.id,
          name: p ? `${p.firstName} ${p.lastName ?? ''}`.trim() : '',
        }
      : null,
  };
}
