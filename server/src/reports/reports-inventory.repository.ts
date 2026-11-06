import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { storeConditionSql } from './lib/store-filter.js';
import {
  InventoryModelRow,
  InventoryStatusRow,
} from './types/reports.types.js';

interface TotalsRow {
  inStockUnits: number;
  inStockLandedValue: number;
  defectiveUnits: number;
  consignedUnits: number;
}

interface AgingRawRow {
  bucket: string;
  units: number;
  landedValue: number;
}

/** Current-stock aggregates: no date range, read straight from devices. */
@Injectable()
export class ReportsInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async totals(storeIds?: string[]): Promise<TotalsRow> {
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`WHERE ${storeConditionSql('"storeId"', storeIds)}`
        : Prisma.empty;
    const rows = await this.prisma.$queryRaw<TotalsRow[]>(Prisma.sql`
      SELECT
        count(*) FILTER (WHERE "statusCode" IN ('IN_STOCK', 'RESERVED'))::int AS "inStockUnits",
        coalesce(sum("landedCost") FILTER (WHERE "statusCode" IN ('IN_STOCK', 'RESERVED')), 0)::float8 AS "inStockLandedValue",
        count(*) FILTER (WHERE "statusCode" = 'DEFECTIVE')::int AS "defectiveUnits",
        count(*) FILTER (WHERE "statusCode" = 'CONSIGNED')::int AS "consignedUnits"
      FROM devices
      ${store}
    `);
    return (
      rows[0] ?? {
        inStockUnits: 0,
        inStockLandedValue: 0,
        defectiveUnits: 0,
        consignedUnits: 0,
      }
    );
  }

  byStatus(storeIds?: string[]): Promise<InventoryStatusRow[]> {
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`WHERE ${storeConditionSql('d."storeId"', storeIds)}`
        : Prisma.empty;
    return this.prisma.$queryRaw<InventoryStatusRow[]>(Prisma.sql`
      SELECT d."statusCode" AS "statusCode", st.label AS label, count(*)::int AS count
      FROM devices d
      JOIN device_statuses st ON st.code = d."statusCode"
      ${store}
      GROUP BY 1, 2, st."sortOrder"
      ORDER BY st."sortOrder"
    `);
  }

  byModel(storeIds?: string[]): Promise<InventoryModelRow[]> {
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('d."storeId"', storeIds)}`
        : Prisma.empty;
    return this.prisma.$queryRaw<InventoryModelRow[]>(Prisma.sql`
      SELECT d."modelId" AS "modelId", (m.brand || ' ' || m.name) AS label,
             count(*)::int AS units,
             sum(d."landedCost")::float8 AS "landedValue",
             avg(EXTRACT(EPOCH FROM (now() - d."intakeDate")) / 86400)::float8 AS "avgDaysInStock"
      FROM devices d
      JOIN device_models m ON m.id = d."modelId"
      WHERE d."statusCode" IN ('IN_STOCK', 'RESERVED') ${store}
      GROUP BY 1, 2
      ORDER BY "landedValue" DESC
    `);
  }

  agingRaw(storeIds?: string[]): Promise<AgingRawRow[]> {
    const store =
      storeIds && storeIds.length > 0
        ? Prisma.sql`AND ${storeConditionSql('d."storeId"', storeIds)}`
        : Prisma.empty;
    return this.prisma.$queryRaw<AgingRawRow[]>(Prisma.sql`
      SELECT bucket, count(*)::int AS units, sum("landedCost")::float8 AS "landedValue"
      FROM (
        SELECT d."landedCost",
          CASE
            WHEN now() - d."intakeDate" < interval '31 days' THEN '0-30'
            WHEN now() - d."intakeDate" < interval '61 days' THEN '31-60'
            WHEN now() - d."intakeDate" < interval '91 days' THEN '61-90'
            ELSE '90+'
          END AS bucket
        FROM devices d
        WHERE d."statusCode" IN ('IN_STOCK', 'RESERVED') ${store}
      ) x
      GROUP BY bucket
    `);
  }
}
