/** Cashier shifts (ADR 0036). Every money figure is a 2-dp string from the server. */

export interface ShiftCashier {
  id: string
  name: string
}

export interface ShiftAccountGroup {
  accountCode: string
  /** Σ money in, 2-dp string. */
  in: string
  /** Σ money out, 2-dp string. */
  out: string
  /** Signed net, 2-dp string. */
  net: string
}

export interface ShiftTypeAccount {
  accountCode: string
  count: number
  total: string
}

export interface ShiftTypeGroup {
  typeCode: string
  count: number
  total: string
  byAccount: ShiftTypeAccount[]
}

/** A shift plus its full computed figures. For an open shift `closedAt`,
 *  `countedCash` and `difference` are null and the figures are live. */
export interface ShiftReportView {
  id: string
  cashier: ShiftCashier
  openedAt: string
  closedAt: string | null
  note: string | null
  openingCount: string
  expectedCash: string
  countedCash: string | null
  /** counted − expected, 2-dp string; null while open. */
  difference: string | null
  differenceAmount: number | null
  cardTotal: string
  byAccount: ShiftAccountGroup[]
  byType: ShiftTypeGroup[]
}

/** A light row for the shifts list. `difference` is 0.00 when closed clean, null while open. */
export interface ShiftListItem {
  id: string
  cashier: ShiftCashier
  openedAt: string
  closedAt: string | null
  openingCount: string
  closingCount: string | null
  difference: string | null
}

export interface ShiftListResult {
  items: ShiftListItem[]
  total: number
  page: number
  pageSize: number
}

export interface ShiftListFilters {
  /** Honoured only with `shift.manage`; the server forces it to the caller otherwise. */
  cashierId?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface OpenShiftDto {
  openingCount: number
}

export interface CloseShiftDto {
  closingCount: number
  note?: string
}

export interface ForceCloseShiftDto {
  closingCount: number
  note: string
}
