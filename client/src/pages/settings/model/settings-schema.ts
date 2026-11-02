import { z } from "zod"
import type { StoreSettings, UpdateSettingsDto } from "@/entities/settings"

/** A numeric text field validated against a server-mirrored range. */
function numField(max: number, integer = true) {
  return z.string().refine(
    (v) => {
      const n = Number(v)
      if (v.trim() === "" || Number.isNaN(n)) return false
      if (integer && !Number.isInteger(n)) return false
      return n >= 0 && n <= max
    },
    { message: "range" }
  )
}

/** Ranges mirror the server UpdateSettingsDto validators. */
export const settingsSchema = z.object({
  storeName: z.string().max(200),
  storeAddress: z.string().max(500),
  storePhone: z.string().max(50),
  receiptFooter: z.string().max(500),
  telegramChatId: z.string().max(100),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm"),
  defaultWarrantyDays: numField(3650),
  minMarginPercent: numField(100, false),
  lowStockThreshold: numField(1000),
  defaultNasiyaDueDays: numField(3650),
  overdueReminderDays: numField(365),
})

export type SettingsValues = z.infer<typeof settingsSchema>

export function toFormValues(s: StoreSettings): SettingsValues {
  return {
    storeName: s.storeName ?? "",
    storeAddress: s.storeAddress ?? "",
    storePhone: s.storePhone ?? "",
    receiptFooter: s.receiptFooter ?? "",
    telegramChatId: s.telegramChatId ?? "",
    closingTime: s.closingTime,
    defaultWarrantyDays: String(s.defaultWarrantyDays),
    minMarginPercent: String(Number(s.minMarginPercent)),
    lowStockThreshold: String(s.lowStockThreshold),
    defaultNasiyaDueDays: String(s.defaultNasiyaDueDays),
    overdueReminderDays: String(s.overdueReminderDays),
  }
}

export function toUpdateDto(v: SettingsValues): UpdateSettingsDto {
  return {
    storeName: v.storeName || null,
    storeAddress: v.storeAddress || null,
    storePhone: v.storePhone || null,
    receiptFooter: v.receiptFooter || null,
    telegramChatId: v.telegramChatId || null,
    closingTime: v.closingTime,
    defaultWarrantyDays: Number(v.defaultWarrantyDays),
    minMarginPercent: Number(v.minMarginPercent),
    lowStockThreshold: Number(v.lowStockThreshold),
    defaultNasiyaDueDays: Number(v.defaultNasiyaDueDays),
    overdueReminderDays: Number(v.overdueReminderDays),
  }
}
