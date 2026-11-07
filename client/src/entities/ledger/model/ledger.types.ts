/** The server may send money as a number today or a decimal string soon; parse both. */
export type Money = number | string

export interface LedgerAccountBalance {
  accountCode: string
  label: string
  balance: number
}

export interface StoreBalanceBreakdown {
  storeId: string
  storeName: string
  accounts: LedgerAccountBalance[]
  total: number
}

export interface LedgerBalances {
  accounts: LedgerAccountBalance[]
  total: number
  stores?: StoreBalanceBreakdown[]
}

/** `GET /ledger/accounts`: active accounts for the pickers, no amounts. */
export interface LedgerAccountOption {
  accountCode: string
  label: string
}

export interface LedgerCodeRef {
  code: string
  label: string
}

export interface LedgerUserRef {
  id: string
  email: string
  profile: { firstName: string; lastName?: string | null } | null
}

export interface LedgerTransaction {
  id: string
  storeId: string
  accountCode: string
  typeCode: string
  /** Signed decimal string, e.g. "-500000". `null` when a cost row's amount is
   *  redacted from a caller without `device.cost.view` (ADR 0028). */
  amount: string | null
  accountRunningBalance?: string | null
  occurredAt: string
  note: string | null
  transferId: string | null
  createdById: string
  createdAt: string
  account: LedgerCodeRef
  type: LedgerCodeRef
  createdBy: LedgerUserRef | null
  device?: {
    id: string
    imei: string | null
    model?: { id: string; name: string; brand?: string | null } | null
  } | null
  shipment?: {
    id: string
    supplier?: { id: string; name: string } | null
  } | null
  sale?: {
    id: string
    clientMutationId?: string | null
    customer?: { id: string; name: string; phone?: string | null } | null
    device?: {
      id: string
      imei: string | null
      model?: { id: string; name: string; brand?: string | null } | null
    } | null
    model?: { id: string; name: string; brand?: string | null } | null
    quantity?: number | null
  } | null
  expense?: {
    id: string
    vendor?: string | null
    description?: string | null
    category?: { id: string; name: string } | null
  } | null
  partnerPayment?: {
    id: string
    partner?: { id: string; shopName: string } | null
  } | null
  customerPurchase?: {
    id: string
    customer?: { id: string; name: string } | null
    device?: {
      id: string
      imei: string | null
      model?: { id: string; name: string } | null
    } | null
  } | null
  repairPayment?: {
    id: string
    repair?: {
      id: string
      ticketNumber: number
      deviceName: string
      customer?: { id: string; name: string } | null
    } | null
  } | null
  creditPayment?: {
    id: string
    credit?: {
      id: string
      customer?: { id: string; name: string } | null
    } | null
  } | null
}

export interface LedgerTransactionPage {
  items: LedgerTransaction[]
  total: number
  page: number
  pageSize: number
}

export type LedgerSortField = "occurredAt" | "amount" | "createdAt"

export interface LedgerFilters {
  accountCode?: string
  typeCode?: string
  direction?: "in" | "out" | "all"
  search?: string
  from?: string
  to?: string
  sort?: LedgerSortField
  dir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface LedgerStatsSummary {
  totalIn: string
  totalOut: string
  netFlow: string
  transactionCount: number
  inCount: number
  outCount: number
}

export interface LedgerTimelinePoint {
  date: string
  inflow: number
  outflow: number
  net: number
}

export interface LedgerTypeBreakdownItem {
  typeCode: string
  typeLabel: string
  direction: "in" | "out"
  amount: number
  count: number
  percentage: number
}

export interface LedgerAccountBreakdownItem {
  accountCode: string
  accountLabel: string
  inflow: number
  outflow: number
  net: number
}

export interface LedgerStats {
  summary: LedgerStatsSummary
  timeline: LedgerTimelinePoint[]
  byType: LedgerTypeBreakdownItem[]
  byAccount: LedgerAccountBreakdownItem[]
}

export interface LedgerStatsFilters {
  accountCode?: string
  from?: string
  to?: string
}

export type LedgerEntryType = "OPENING" | "DEPOSIT" | "WITHDRAWAL" | "CORRECTION"

export interface CreateLedgerEntryDto {
  accountCode: string
  typeCode: LedgerEntryType
  amount: number
  note?: string
  occurredAt?: string
}

export interface LedgerTransferDto {
  fromAccountCode: string
  toAccountCode: string
  amount: number
  note?: string
  occurredAt?: string
}
