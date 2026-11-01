import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ModelPricingRow } from './types/reports.types.js';

/**
 * Rolling-average pricing per (modelId, specs->>'storage'). JSONB grouping
 * forces raw SQL; it is parameterised via Prisma.sql and lives only here.
 */
@Injectable()
export class ReportsModelPricingRepository {
  constructor(private readonly prisma: PrismaService) {}

  rollingAverages(windowDays: number, modelId?: string) {
    const since = new Date(Date.now() - windowDays * 86_400_000);
    const devModel = modelId
      ? Prisma.sql`WHERE d."modelId" = ${modelId}`
      : Prisma.empty;
    const soldModel = modelId
      ? Prisma.sql`AND d."modelId" = ${modelId}`
      : Prisma.empty;
    return this.prisma.$queryRaw<ModelPricingRow[]>(Prisma.sql`
      WITH dev AS (
        SELECT d."modelId" AS model_id,
               d.specs->>'storage' AS storage,
               avg(d."acquisitionCost") FILTER (WHERE d."intakeDate" >= ${since})::float8 AS avg_acq,
               avg(d."landedCost") FILTER (WHERE d."intakeDate" >= ${since})::float8 AS avg_landed,
               count(*) FILTER (WHERE d."statusCode" = 'IN_STOCK')::int AS in_stock
        FROM devices d
        ${devModel}
        GROUP BY d."modelId", d.specs->>'storage'
      ),
      sold AS (
        SELECT d."modelId" AS model_id,
               d.specs->>'storage' AS storage,
               avg(s."salePrice")::float8 AS avg_sell,
               count(*)::int AS units_sold
        FROM sales s
        JOIN devices d ON d.id = s."deviceId"
        WHERE s."soldAt" >= ${since} ${soldModel}
        GROUP BY d."modelId", d.specs->>'storage'
      )
      SELECT coalesce(dev.model_id, sold.model_id) AS "modelId",
             coalesce(dev.storage, sold.storage) AS "storage",
             dev.avg_acq AS "avgAcquisitionCost",
             dev.avg_landed AS "avgLandedCost",
             sold.avg_sell AS "avgSellingPrice",
             coalesce(dev.in_stock, 0) AS "unitsInStock",
             coalesce(sold.units_sold, 0) AS "unitsSold"
      FROM dev
      FULL OUTER JOIN sold
        ON dev.model_id = sold.model_id
       AND dev.storage IS NOT DISTINCT FROM sold.storage
      ORDER BY "modelId", "storage"
    `);
  }
}
