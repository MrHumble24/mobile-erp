import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  QuantityProductRow,
  UnitProductRow,
  UnitRow,
} from './types/catalog.types.js';

/**
 * Read-model Prisma access for the POS catalog. Like the reports module it
 * reads across the device / stock tables directly (never through those modules'
 * write services) because it is a pure cross-table read. "Sellable" = a unit
 * whose statusCode is IN_STOCK, so consigned / sold / defective units drop out
 * (ADR 0031).
 */
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** IMEI/SERIAL products that have at least one IN_STOCK unit in this store. */
  unitProducts(
    storeId: string,
    categoryId?: string,
    search?: string,
  ): Promise<UnitProductRow[]> {
    const filters: Prisma.Sql[] = [
      Prisma.sql`m."kindCode" IN ('IMEI', 'SERIAL')`,
    ];
    if (categoryId) filters.push(Prisma.sql`m."categoryId" = ${categoryId}`);
    const term = search?.trim();
    if (term) {
      const like = `%${term}%`;
      // Storage lives on the units; match a product that HAS such a unit without
      // narrowing the count/price aggregates below.
      filters.push(Prisma.sql`(m.name ILIKE ${like} OR m."modelCode" ILIKE ${like}
        OR EXISTS (SELECT 1 FROM devices ds WHERE ds."modelId" = m.id
          AND ds."statusCode" = 'IN_STOCK' AND ds."storeId" = ${storeId}
          AND ds.specs->>'storage' ILIKE ${like}))`);
    }
    const where = Prisma.join(filters, ' AND ');
    return this.prisma.$queryRaw<UnitProductRow[]>(Prisma.sql`
      SELECT m.id AS "modelId", m.brand, m.name, m."kindCode",
             m."categoryId", cat.name AS "categoryName", m."imageFileName",
             count(d.id)::int AS "inStock",
             min(d."targetPrice")::numeric AS "minTargetPrice",
             max(d."targetPrice")::numeric AS "maxTargetPrice"
      FROM device_models m
      JOIN devices d ON d."modelId" = m.id
        AND d."statusCode" = 'IN_STOCK' AND d."storeId" = ${storeId}
      LEFT JOIN product_categories cat ON cat.id = m."categoryId"
      WHERE ${where}
      GROUP BY m.id, m.brand, m.name, m."kindCode", m."categoryId",
               cat.name, m."imageFileName"
      ORDER BY m.brand, m.name`);
  }

  /** Active QUANTITY products with their summed stock (may be zero/negative). */
  quantityProducts(
    storeId: string,
    categoryId?: string,
    search?: string,
  ): Promise<QuantityProductRow[]> {
    const filters: Prisma.Sql[] = [
      Prisma.sql`m."kindCode" = 'QUANTITY'`,
      Prisma.sql`m."isActive" = true`,
    ];
    if (categoryId) filters.push(Prisma.sql`m."categoryId" = ${categoryId}`);
    const term = search?.trim();
    if (term) {
      const like = `%${term}%`;
      filters.push(
        Prisma.sql`(m.name ILIKE ${like} OR m."modelCode" ILIKE ${like})`,
      );
    }
    const where = Prisma.join(filters, ' AND ');
    return this.prisma.$queryRaw<QuantityProductRow[]>(Prisma.sql`
      SELECT m.id AS "modelId", m.brand, m.name, m."kindCode",
             m."categoryId", cat.name AS "categoryName", m."imageFileName",
             m."salePrice",
             coalesce(sum(sm.quantity), 0)::int AS quantity
      FROM device_models m
      LEFT JOIN product_categories cat ON cat.id = m."categoryId"
      LEFT JOIN stock_movements sm ON sm."modelId" = m.id AND sm."storeId" = ${storeId}
      WHERE ${where}
      GROUP BY m.id, m.brand, m.name, m."kindCode", m."categoryId",
               cat.name, m."imageFileName", m."salePrice"
      ORDER BY m.brand, m.name`);
  }

  /** The IN_STOCK units of one product in this store, with the latest QC grade. */
  sellableUnits(storeId: string, modelId: string): Promise<UnitRow[]> {
    return this.prisma.$queryRaw<UnitRow[]>(Prisma.sql`
      SELECT d.id, d.imei, d."serialNumber", d.specs, d."targetPrice",
             (SELECT qi."gradeCode" FROM qc_inspections qi
              WHERE qi."deviceId" = d.id
              ORDER BY qi."inspectedAt" DESC LIMIT 1) AS "gradeCode"
      FROM devices d
      WHERE d."modelId" = ${modelId} AND d."statusCode" = 'IN_STOCK'
        AND d."storeId" = ${storeId}
      ORDER BY d."targetPrice" ASC NULLS LAST, d."createdAt" ASC`);
  }
}
