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
  occurredAt: string
  note: string | null
  transferId: string | null
  createdById: string
  createdAt: string
  account: LedgerCodeRef
  type: LedgerCodeRef
  createdBy: LedgerUserRef | null
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
  from?: string
  to?: string
  sort?: LedgerSortField
  dir?: "asc" | "desc"
  page?: number
  pageSize?: number
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
