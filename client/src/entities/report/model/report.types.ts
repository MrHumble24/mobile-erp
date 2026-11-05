export interface ProfitReport {
  revenue: number
  cogs: number
  unitsSold: number
  grossProfit: number
  expenses: number
  netOperatingIncome: number
  byChannel: { retail: number; b2b: number }
  returnsRefunded: number
}

export type TrendBucket = "day" | "week" | "month"

export interface TrendPoint {
  bucket: string
  revenue: number
  cogs: number
  grossProfit: number
  expenses: number
  unitsSold: number
  returnsRefunded: number
}

export type BreakdownGroupBy = "channel" | "model" | "cashier" | "day"

export interface BreakdownRow {
  key: string
  label: string
  revenue: number
  cogs: number
  grossProfit: number
  unitsSold: number
  share: number
}

export interface ExpenseReportRow {
  key: string
  label: string
  total: number
  share: number
}

export type ExpenseGroupBy = "category" | "month" | "day"

export interface ReturnRow {
  id: string
  saleId: string
  imei: string | null
  serialNumber?: string | null
  model: string
  refundAmount: number
  reason: string | null
  returnedAt: string
  processedBy: string
}

export interface ReturnsPage {
  items: ReturnRow[]
  total: number
  page: number
  pageSize: number
}

export interface ConsignmentPartnerRow {
  partnerId: string
  shopName: string
  outstanding: number
  openCount: number
  overdueCount: number
  settledRevenue: number
}

export interface ConsignmentsReport {
  createdCount: number
  settledCount: number
  returnedCount: number
  settledRevenue: number
  outstandingTotal: number
  overdueCount: number
  byPartner: ConsignmentPartnerRow[]
}

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+"

export interface InventoryStatusRow {
  statusCode: string
  label: string
  count: number
}

export interface InventoryModelRow {
  modelId: string
  label: string
  units: number
  landedValue: number
  avgDaysInStock: number
}

export interface InventoryAgingRow {
  bucket: AgingBucket
  units: number
  landedValue: number
}

export interface InventoryReport {
  inStockUnits: number
  inStockLandedValue: number
  defectiveUnits: number
  consignedUnits: number
  byStatus: InventoryStatusRow[]
  byModel: InventoryModelRow[]
  aging: InventoryAgingRow[]
}

export interface ModelPricingRow {
  modelId: string
  storage: string | null
  avgAcquisitionCost: number | null
  avgLandedCost: number | null
  avgSellingPrice: number | null
  unitsInStock: number
  unitsSold: number
}

export interface DailyClosingReport {
  date: string
  unitsSold: number
  revenue: number
  grossProfit: number
  expenses: number
  newConsignments: number
  settledConsignments: number
}
