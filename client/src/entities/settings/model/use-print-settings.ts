import { useSettings } from "./use-settings"

export interface PrintSettings {
  receiptPrintingEnabled: boolean
  receiptPaperWidthMm: 58 | 80
  priceTagsEnabled: boolean
}

/** Receipt and price-tag printing switches (ADR 0043), defaulting safely while settings load. */
export function usePrintSettings(): PrintSettings {
  const { data } = useSettings()
  return {
    receiptPrintingEnabled: data?.receiptPrintingEnabled ?? false,
    receiptPaperWidthMm: data?.receiptPaperWidthMm === 58 ? 58 : 80,
    priceTagsEnabled: data?.priceTagsEnabled ?? false,
  }
}
