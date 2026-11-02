import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
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

  async totals(): Promise<TotalsRow> {
    const rows = await this.prisma.$queryRaw<TotalsRow[]>(Prisma.sql`
      SELECT
        count(*) FILTER (WHERE "statusCode" = 'IN_STOCK')::int AS "inStockUnits",
        coalesce(sum("landedCost") FILTER (WHERE "statusCode" = 'IN_STOCK'), 0)::float8 AS "inStockLandedValue",
        count(*) FILTER (WHERE "statusCode" = 'DEFECTIVE')::int AS "defectiveUnits",
        count(*) FILTER (WHERE "statusCode" = 'CONSIGNED')::int AS "consignedUnits"
      FROM devices
    `);
    return rows[0];
  }

  byStatus(): Promise<InventoryStatusRow[]> {
    return this.prisma.$queryRaw<InventoryStatusRow[]>(Prisma.sql`
      SELECT d."statusCode" AS "statusCode", st.label AS label, count(*)::int AS count
      FROM devices d
      JOIN device_statuses st ON st.code = d."statusCode"
      GROUP BY 1, 2, st."sortOrder"
      ORDER BY st."sortOrder"
    `);
  }

  byModel(): Promise<InventoryModelRow[]> {
    return this.prisma.$queryRaw<InventoryModelRow[]>(Prisma.sql`
      SELECT d."modelId" AS "modelId", (m.brand || ' ' || m.name) AS label,
             count(*)::int AS units,
             sum(d."landedCost")::float8 AS "landedValue",
             avg(EXTRACT(EPOCH FROM (now() - d."intakeDate")) / 86400)::float8 AS "avgDaysInStock"
      FROM devices d
      JOIN device_models m ON m.id = d."modelId"
      WHERE d."statusCode" = 'IN_STOCK'
      GROUP BY 1, 2
      ORDER BY "landedValue" DESC
    `);
  }

  agingRaw(): Promise<AgingRawRow[]> {
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
        WHERE d."statusCode" = 'IN_STOCK'
      ) x
      GROUP BY bucket
    `);
  }
}
