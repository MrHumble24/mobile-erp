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
