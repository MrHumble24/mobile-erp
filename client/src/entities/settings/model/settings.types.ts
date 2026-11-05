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
  /** Discounts (ADR 0034). */
  discountsEnabled: boolean
  discountPercentAllowed: boolean
  discountAmountAllowed: boolean
  discountPresetsPercent: number[]
  discountPresetsAmount: number[]
  /** The cashier ceiling, a 2-dp percent string. */
  maxDiscountPercent: string
  /** Customer credit (ADR 0035). */
  customerCreditEnabled: boolean
  /** Default per-customer credit ceiling (2-dp string); null = no cap. */
  defaultCreditLimit: string | null
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
  /** Discounts (ADR 0034). Omitted = left unchanged server-side. */
  discountsEnabled?: boolean
  discountPercentAllowed?: boolean
  discountAmountAllowed?: boolean
  discountPresetsPercent?: number[]
  discountPresetsAmount?: number[]
  maxDiscountPercent?: number
  /** Customer credit (ADR 0035). Omitted = left unchanged server-side. */
  customerCreditEnabled?: boolean
  defaultCreditLimit?: number | null
}
