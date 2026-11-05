import { z } from "zod"
import type { StoreSettings, UpdateSettingsDto } from "@/entities/settings"

/** A numeric text field validated against a server-mirrored range. */
function numField(max: number, integer = true, maxDecimals?: number) {
  return z.string().refine(
    (v) => {
      const n = Number(v)
      if (v.trim() === "" || Number.isNaN(n)) return false
      if (integer && !Number.isInteger(n)) return false
      if (maxDecimals !== undefined && (v.split(".")[1]?.length ?? 0) > maxDecimals) return false
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
  discountsEnabled: z.boolean(),
  discountPercentAllowed: z.boolean(),
  discountAmountAllowed: z.boolean(),
  maxDiscountPercent: numField(100, false),
  // Comma-separated quick values; parsed + capped to five on submit.
  discountPresetsPercent: z.string(),
  discountPresetsAmount: z.string(),
  customerCreditEnabled: z.boolean(),
  // Empty = no cap (null); otherwise a non-negative amount.
  defaultCreditLimit: z.string().refine(
    (v) => {
      if (v.trim() === "") return true
      const n = Number(v)
      return !Number.isNaN(n) && n >= 0 && n <= 100_000_000_000
    },
    { message: "range" }
  ),
  shiftsEnabled: z.boolean(),
  repairsEnabled: z.boolean(),
  bonusEnabled: z.boolean(),
  bonusEarnPercent: numField(100, false, 2),
  bonusMaxRedeemPercent: numField(100, false, 2),
  receiptPrintingEnabled: z.boolean(),
  // Select values are strings; converted to a number on submit.
  receiptPaperWidthMm: z.enum(["58", "80"]),
  priceTagsEnabled: z.boolean(),
})

export type SettingsValues = z.infer<typeof settingsSchema>

/** Parse a comma-separated preset list into up to five positive numbers. */
function parsePresets(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 5)
}

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
    discountsEnabled: s.discountsEnabled,
    discountPercentAllowed: s.discountPercentAllowed,
    discountAmountAllowed: s.discountAmountAllowed,
    maxDiscountPercent: String(Number(s.maxDiscountPercent)),
    discountPresetsPercent: (s.discountPresetsPercent ?? []).join(", "),
    discountPresetsAmount: (s.discountPresetsAmount ?? []).join(", "),
    customerCreditEnabled: s.customerCreditEnabled,
    defaultCreditLimit: s.defaultCreditLimit == null ? "" : String(Number(s.defaultCreditLimit)),
    shiftsEnabled: s.shiftsEnabled,
    repairsEnabled: s.repairsEnabled,
    bonusEnabled: s.bonusEnabled,
    bonusEarnPercent: String(Number(s.bonusEarnPercent)),
    bonusMaxRedeemPercent: String(Number(s.bonusMaxRedeemPercent)),
    receiptPrintingEnabled: s.receiptPrintingEnabled,
    receiptPaperWidthMm: s.receiptPaperWidthMm === 58 ? "58" : "80",
    priceTagsEnabled: s.priceTagsEnabled,
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
    discountsEnabled: v.discountsEnabled,
    discountPercentAllowed: v.discountPercentAllowed,
    discountAmountAllowed: v.discountAmountAllowed,
    maxDiscountPercent: Number(v.maxDiscountPercent),
    discountPresetsPercent: parsePresets(v.discountPresetsPercent),
    discountPresetsAmount: parsePresets(v.discountPresetsAmount),
    customerCreditEnabled: v.customerCreditEnabled,
    defaultCreditLimit: v.defaultCreditLimit.trim() === "" ? null : Number(v.defaultCreditLimit),
    shiftsEnabled: v.shiftsEnabled,
    repairsEnabled: v.repairsEnabled,
    bonusEnabled: v.bonusEnabled,
    bonusEarnPercent: Number(v.bonusEarnPercent),
    bonusMaxRedeemPercent: Number(v.bonusMaxRedeemPercent),
    receiptPrintingEnabled: v.receiptPrintingEnabled,
    receiptPaperWidthMm: Number(v.receiptPaperWidthMm),
    priceTagsEnabled: v.priceTagsEnabled,
  }
}
