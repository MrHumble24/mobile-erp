export interface StockAlertRuleView {
  id: string;
  modelId: string;
  storage: string;
  threshold: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A rule breached right now: current IN_STOCK count below its threshold. */
export interface LowStockView extends StockAlertRuleView {
  currentCount: number;
}

export interface StockAlertRuleInput {
  modelId: string;
  storage: string;
  threshold: number;
}

export interface StockAlertRulePatch {
  storage?: string;
  threshold?: number;
}
