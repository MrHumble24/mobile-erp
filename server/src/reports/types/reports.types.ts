/** Raw aggregate rows (service converts Decimal → number and derives totals). */
export interface SaleTotals {
  revenue: number;
  cogs: number;
  unitsSold: number;
}

export interface ProfitReport extends SaleTotals {
  grossProfit: number;
  expenses: number;
  netOperatingIncome: number;
  byChannel: { retail: number; b2b: number };
  returnsRefunded: number;
}

export interface ExpenseReportRow {
  key: string;
  label: string;
  total: number;
}

/** One (modelId, storage) pricing row from the raw rolling-window query. */
export interface ModelPricingRow {
  modelId: string;
  storage: string | null;
  avgAcquisitionCost: number | null;
  avgLandedCost: number | null;
  avgSellingPrice: number | null;
  unitsInStock: number;
  unitsSold: number;
}

export interface DailyClosingReport {
  date: string;
  unitsSold: number;
  revenue: number;
  grossProfit: number;
  expenses: number;
  newConsignments: number;
  settledConsignments: number;
}

export type TrendBucket = 'day' | 'week' | 'month';

/** One point of the trend series; empty buckets are zero-filled. */
export interface TrendPoint {
  bucket: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  unitsSold: number;
  returnsRefunded: number;
}

/** Raw per-bucket aggregate row before zero-fill and grossProfit derivation. */
export interface TrendRawRow {
  bucket: Date;
  revenue: number;
  cogs: number;
  expenses: number;
  unitsSold: number;
  returnsRefunded: number;
}

export type BreakdownGroupBy = 'channel' | 'model' | 'cashier' | 'day';

/** Raw per-key aggregate row before grossProfit/share derivation. */
export interface BreakdownRawRow {
  key: string;
  label: string;
  revenue: number;
  cogs: number;
  unitsSold: number;
}

export interface BreakdownRow extends BreakdownRawRow {
  grossProfit: number;
  /** 0–1 of total revenue. */
  share: number;
}

export interface ExpenseReportRowWithShare extends ExpenseReportRow {
  share: number;
}

export interface ReturnRow {
  id: string;
  saleId: string;
  imei: string;
  model: string;
  refundAmount: number;
  reason: string | null;
  returnedAt: string;
  processedBy: string;
}

export interface ReturnsPage {
  items: ReturnRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ConsignmentPartnerRow {
  partnerId: string;
  shopName: string;
  outstanding: number;
  openCount: number;
  overdueCount: number;
  settledRevenue: number;
}

export interface ConsignmentsReport {
  createdCount: number;
  settledCount: number;
  returnedCount: number;
  settledRevenue: number;
  outstandingTotal: number;
  overdueCount: number;
  byPartner: ConsignmentPartnerRow[];
}

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export interface InventoryStatusRow {
  statusCode: string;
  label: string;
  count: number;
}

export interface InventoryModelRow {
  modelId: string;
  label: string;
  units: number;
  landedValue: number;
  avgDaysInStock: number;
}

export interface InventoryAgingRow {
  bucket: AgingBucket;
  units: number;
  landedValue: number;
}

export interface InventoryReport {
  inStockUnits: number;
  inStockLandedValue: number;
  defectiveUnits: number;
  consignedUnits: number;
  byStatus: InventoryStatusRow[];
  byModel: InventoryModelRow[];
  aging: InventoryAgingRow[];
}
