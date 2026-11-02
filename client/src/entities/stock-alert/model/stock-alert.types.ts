export interface StockAlertRuleView {
  id: string
  modelId: string
  storage: string
  threshold: number
  createdAt: string
  updatedAt: string
}

export interface LowStockView extends StockAlertRuleView {
  currentCount: number
}

export interface CreateStockAlertRuleDto {
  modelId: string
  storage: string
  threshold: number
}

export interface UpdateStockAlertRuleDto {
  storage?: string
  threshold?: number
}
