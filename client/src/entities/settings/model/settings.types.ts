export interface StoreSettings {
  id: number
  telegramChatId: string | null
  closingTime: string
  defaultWarrantyDays: number
  minMarginPercent: string | number
  lowStockThreshold: number
  updatedAt: string
}

export interface UpdateSettingsDto {
  telegramChatId?: string | null
  closingTime?: string
  defaultWarrantyDays?: number
  minMarginPercent?: number
  lowStockThreshold?: number
}
