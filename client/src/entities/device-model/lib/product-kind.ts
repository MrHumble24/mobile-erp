import type { ProductKind } from "../model/device-model.types"

interface ProductKindOption {
  code: ProductKind
  /** i18n key in the `catalog` namespace for the label. */
  labelKey: string
  /** i18n key in the `catalog` namespace for the hint line. */
  hintKey: string
}

/** The three product kinds and their copy keys (ADR 0029). Order = the form's order. */
export const PRODUCT_KINDS: ProductKindOption[] = [
  { code: "IMEI", labelKey: "catalog.kindImei", hintKey: "catalog.kindImeiHint" },
  { code: "SERIAL", labelKey: "catalog.kindSerial", hintKey: "catalog.kindSerialHint" },
  { code: "QUANTITY", labelKey: "catalog.kindQuantity", hintKey: "catalog.kindQuantityHint" },
]

export function productKindLabelKey(code: ProductKind | string): string {
  return PRODUCT_KINDS.find((k) => k.code === code)?.labelKey ?? "catalog.kindImei"
}
