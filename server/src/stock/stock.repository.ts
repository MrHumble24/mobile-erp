import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StockAggregate } from './lib/stock-math.js';
import type {
  QuantityProductView,
  StockLevelRow,
  StockMovementInput,
} from './types/stock.types.js';

type Tx = Prisma.TransactionClient;

interface AggRow {
  quantity: number;
  value: Prisma.Decimal | null;
}

/** All Prisma access for quantity stock. Append-only: no update/delete of a movement. */
@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Append one movement; pass `tx` to post inside a caller's transaction. */
  create(input: StockMovementInput, tx?: Tx) {
    return (tx ?? this.prisma).stockMovement.create({
      data: {
        storeId: input.storeId,
        modelId: input.modelId,
        typeCode: input.typeCode,
        quantity: input.quantity,
        unitCostSnapshot: new Prisma.Decimal(input.unitCostSnapshot),
        shipmentId: input.shipmentId,
        saleId: input.saleId,
        note: input.note,
        createdById: input.createdById,
        occurredAt: input.occurredAt,
      },
      select: { id: true },
    });
  }

  /** A product's current stock position in one store (tx-aware for posting). */
  async aggregate(
    storeId: string,
    modelId: string,
    tx?: Tx,
  ): Promise<StockAggregate> {
    const client = tx ?? this.prisma;
    const [[agg], [latest]] = await Promise.all([
      client.$queryRaw<AggRow[]>(Prisma.sql`
        SELECT coalesce(sum(quantity), 0)::int AS quantity,
               coalesce(sum(quantity * "unitCostSnapshot"), 0)::numeric AS value
        FROM stock_movements WHERE "storeId" = ${storeId} AND "modelId" = ${modelId}`),
      client.$queryRaw<{ unitCostSnapshot: Prisma.Decimal }[]>(Prisma.sql`
        SELECT "unitCostSnapshot" FROM stock_movements
        WHERE "storeId" = ${storeId} AND "modelId" = ${modelId} AND "typeCode" = 'PURCHASE'
        ORDER BY "occurredAt" DESC LIMIT 1`),
    ]);
    return {
      quantity: Number(agg?.quantity ?? 0),
      value: new Prisma.Decimal(agg?.value ?? 0),
      latestPurchaseCost: new Prisma.Decimal(latest?.unitCostSnapshot ?? 0),
    };
  }

  /** One pass: every QUANTITY product with its stock, filtered + searched. */
  listStock(
    storeId: string,
    categoryId?: string,
    search?: string,
  ): Promise<StockLevelRow[]> {
    const filters: Prisma.Sql[] = [Prisma.sql`m."kindCode" = 'QUANTITY'`];
    if (categoryId) filters.push(Prisma.sql`m."categoryId" = ${categoryId}`);
    const term = search?.trim();
    if (term) {
      const like = `%${term}%`;
      filters.push(Prisma.sql`(m.name ILIKE ${like} OR m.barcode ILIKE ${like}
        OR m.brand ILIKE ${like} OR m."modelCode" ILIKE ${like})`);
    }
    const where = Prisma.join(filters, ' AND ');
    return this.prisma.$queryRaw<StockLevelRow[]>(Prisma.sql`
      SELECT m.id AS "modelId", m.brand, m.name, m.barcode,
             m."modelCode", m."categoryId", m."salePrice",
             coalesce(sum(sm.quantity), 0)::int AS quantity,
             coalesce(sum(sm.quantity * sm."unitCostSnapshot"), 0)::numeric AS value,
             coalesce((
               SELECT lp."unitCostSnapshot" FROM stock_movements lp
               WHERE lp."modelId" = m.id AND lp."storeId" = ${storeId}
                 AND lp."typeCode" = 'PURCHASE'
               ORDER BY lp."occurredAt" DESC LIMIT 1), 0)::numeric AS "latestPurchaseCost"
      FROM device_models m
      LEFT JOIN stock_movements sm ON sm."modelId" = m.id AND sm."storeId" = ${storeId}
      WHERE ${where}
      GROUP BY m.id, m.brand, m.name, m.barcode, m."modelCode", m."categoryId", m."salePrice"
      ORDER BY m.brand, m.name`);
  }

  async listMovements(
    storeId: string,
    modelId: string,
    page: number,
    pageSize: number,
  ) {
    const where = { storeId, modelId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          quantity: true,
          unitCostSnapshot: true,
          shipmentId: true,
          saleId: true,
          note: true,
          occurredAt: true,
          type: { select: { code: true, label: true } },
          createdBy: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return { items, total };
  }

  /** The model's kind (to reject a non-QUANTITY product), or null if missing. */
  async modelKind(modelId: string): Promise<string | null> {
    const row = await this.prisma.deviceModel.findUnique({
      where: { id: modelId },
      select: { kindCode: true },
    });
    return row?.kindCode ?? null;
  }

  /** Quantity products with a barcode set, with their stock — for scan + sync. */
  async quantityProductsForFeed(
    storeId: string,
  ): Promise<QuantityProductView[]> {
    const rows = await this.listStock(storeId);
    return rows.map((r) => ({
      modelId: r.modelId,
      brand: r.brand,
      name: r.name,
      barcode: r.barcode,
      salePrice: r.salePrice === null ? null : r.salePrice.toFixed(2),
      quantity: Number(r.quantity),
    }));
  }

  /** One quantity product matched by its barcode (for the scan lookup). */
  async findByBarcode(
    storeId: string,
    barcode: string,
  ): Promise<QuantityProductView | null> {
    const model = await this.prisma.deviceModel.findFirst({
      where: { barcode, kindCode: 'QUANTITY' },
      select: {
        id: true,
        brand: true,
        name: true,
        barcode: true,
        salePrice: true,
      },
    });
    if (!model) return null;
    const agg = await this.aggregate(storeId, model.id);
    return {
      modelId: model.id,
      brand: model.brand,
      name: model.name,
      barcode: model.barcode,
      salePrice: model.salePrice === null ? null : model.salePrice.toFixed(2),
      quantity: agg.quantity,
    };
  }

  /** Σ(quantity × unitCostSnapshot) across all quantity stock, for the inventory report. */
  async totalStockValue(): Promise<Prisma.Decimal> {
    const [row] = await this.prisma.$queryRaw<
      { value: Prisma.Decimal | null }[]
    >(
      Prisma.sql`SELECT coalesce(sum(quantity * "unitCostSnapshot"), 0)::numeric AS value
                 FROM stock_movements`,
    );
    return new Prisma.Decimal(row?.value ?? 0);
  }
}
