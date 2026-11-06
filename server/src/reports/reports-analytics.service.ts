import { Injectable } from '@nestjs/common';
import { PartnersService } from '../partners/partners.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import {
  ProfitBreakdownQueryDto,
  ReturnsQueryDto,
  TrendQueryDto,
} from './dto/reports-query.dto.js';
import { fillAging } from './lib/aging.js';
import { toBreakdownRows } from './lib/share.js';
import { fillTrend } from './lib/trend.js';
import { ReportsBreakdownRepository } from './reports-breakdown.repository.js';
import { ReportsConsignmentsRepository } from './reports-consignments.repository.js';
import { ReportsInventoryRepository } from './reports-inventory.repository.js';
import { ReportsReturnsRepository } from './reports-returns.repository.js';
import { ReportsTrendRepository } from './reports-trend.repository.js';
import { rangeOrDefault } from './reports.service.js';
import {
  BreakdownRow,
  ConsignmentPartnerRow,
  ConsignmentsReport,
  InventoryReport,
  ReturnsPage,
  TrendPoint,
} from './types/reports.types.js';

@Injectable()
export class ReportsAnalyticsService {
  constructor(
    private readonly trendRepo: ReportsTrendRepository,
    private readonly breakdownRepo: ReportsBreakdownRepository,
    private readonly returnsRepo: ReportsReturnsRepository,
    private readonly consignmentsRepo: ReportsConsignmentsRepository,
    private readonly inventoryRepo: ReportsInventoryRepository,
    private readonly partners: PartnersService,
    private readonly stock: StockService,
    private readonly stores: StoresService,
  ) {}

  async trend(query: TrendQueryDto): Promise<TrendPoint[]> {
    const storeIds = await this.stores.currentStoreIds();
    const { from, to } = rangeOrDefault(query);
    const rows = await this.trendRepo.series(from, to, query.bucket, storeIds);
    return fillTrend(rows, from, to, query.bucket);
  }

  async profitBreakdown(
    query: ProfitBreakdownQueryDto,
  ): Promise<BreakdownRow[]> {
    const storeIds = await this.stores.currentStoreIds();
    const { from, to } = rangeOrDefault(query);
    const rows = await this.breakdownRepo.breakdown(
      query.groupBy,
      from,
      to,
      storeIds,
    );
    return toBreakdownRows(rows);
  }

  async returns(query: ReturnsQueryDto): Promise<ReturnsPage> {
    const storeIds = await this.stores.currentStoreIds();
    const { items, total } = await this.returnsRepo.page(
      parseDate(query.from),
      parseDate(query.to),
      query.page,
      query.pageSize,
      storeIds,
    );
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async consignments(query: {
    from?: string;
    to?: string;
  }): Promise<ConsignmentsReport> {
    const storeIds = await this.stores.currentStoreIds();
    const from = parseDate(query.from);
    const to = parseDate(query.to);
    const [[createdCount, settledCount, returnedCount], revenueRows, partners] =
      await Promise.all([
        this.consignmentsRepo.counts(from, to, storeIds),
        this.consignmentsRepo.settledRevenueByPartner(from, to, storeIds),
        this.partners.list(),
      ]);
    const revenueOf = new Map(
      revenueRows.map((r) => [r.partnerId, r.settledRevenue]),
    );
    const byPartner: ConsignmentPartnerRow[] = partners
      .map((p) => ({
        partnerId: p.id,
        shopName: p.shopName,
        outstanding: Number(p.outstanding),
        openCount: p.openCount,
        overdueCount: p.overdueCount,
        settledRevenue: revenueOf.get(p.id) ?? 0,
      }))
      .filter(
        (p) =>
          p.outstanding !== 0 ||
          p.openCount > 0 ||
          p.overdueCount > 0 ||
          p.settledRevenue > 0,
      )
      .sort((a, b) => b.outstanding - a.outstanding);
    return {
      createdCount,
      settledCount,
      returnedCount,
      settledRevenue: revenueRows.reduce((s, r) => s + r.settledRevenue, 0),
      outstandingTotal: byPartner.reduce((s, p) => s + p.outstanding, 0),
      overdueCount: byPartner.reduce((s, p) => s + p.overdueCount, 0),
      byPartner,
    };
  }

  async inventory(): Promise<InventoryReport> {
    const storeIds = await this.stores.currentStoreIds();
    const [totals, byStatus, byModel, agingRaw, quantityValue] =
      await Promise.all([
        this.inventoryRepo.totals(storeIds),
        this.inventoryRepo.byStatus(storeIds),
        this.inventoryRepo.byModel(storeIds),
        this.inventoryRepo.agingRaw(storeIds),
        this.stock.totalStockValue(),
      ]);
    // Stock value includes quantity stock (ADR 0030). Units stay phone-centric:
    // accessory pieces and phones are different units, so only value is folded.
    return {
      ...totals,
      inStockLandedValue: totals.inStockLandedValue + Number(quantityValue),
      byStatus,
      byModel,
      aging: fillAging(agingRaw),
    };
  }
}

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}
