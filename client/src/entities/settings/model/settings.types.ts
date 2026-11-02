export interface StoreSettings {
  id: number
  storeName: string | null
  storeAddress: string | null
  storePhone: string | null
  receiptFooter: string | null
  telegramChatId: string | null
  closingTime: string
  defaultWarrantyDays: number
  minMarginPercent: string | number
  lowStockThreshold: number
  defaultNasiyaDueDays: number
  overdueReminderDays: number
  updatedAt: string
}

export interface UpdateSettingsDto {
  storeName?: string | null
  storeAddress?: string | null
  storePhone?: string | null
  receiptFooter?: string | null
  telegramChatId?: string | null
  closingTime: string
  defaultWarrantyDays: number
  minMarginPercent: number
  lowStockThreshold: number
  defaultNasiyaDueDays: number
  overdueReminderDays: number
}
