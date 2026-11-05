/** A customs price-list version summary (no items). Money is a decimal string. */
export interface PriceListSummary {
  id: string
  effectiveAt: string
  note: string | null
  createdById: string
  createdAt: string
  itemCount: number
}

export type FeeChange = "up" | "down" | "same" | "new"

export interface CurrentPriceListItem {
  customsCode: string
  description: string | null
  /** Decimal string. */
  fee: string
  /** Prior version's fee for the same code; null when the code is new. */
  previousFee: string | null
  usedByModel: boolean
}

export interface CurrentPriceList {
  id: string
  effectiveAt: string
  note: string | null
  items: CurrentPriceListItem[]
}

export type UnmatchedReason = "MISSING_CODE" | "CODE_NOT_IN_CURRENT_LIST"

export interface UnmatchedModel {
  id: string
  brand: string
  name: string
  customsCode: string | null
  reason: UnmatchedReason
}

export interface FeeHistoryPoint {
  listId: string
  effectiveAt: string
  /** Decimal string. */
  fee: string
}

export interface CreatePriceListItem {
  customsCode: string
  description?: string
  fee: number
}

export interface CreatePriceListDto {
  effectiveAt?: string
  note?: string
  items: CreatePriceListItem[]
}

/** Up / down / same / new marker for a current-list item vs its previous fee. */
export function feeChangeOf(item: CurrentPriceListItem): FeeChange {
  if (item.previousFee == null) return "new"
  const now = Number(item.fee)
  const prev = Number(item.previousFee)
  if (now > prev) return "up"
  if (now < prev) return "down"
  return "same"
}
