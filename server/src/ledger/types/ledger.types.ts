/** Manual entry types the owner may post directly (TRANSFER is its own path). */
export const MANUAL_ENTRY_TYPES = [
  'OPENING',
  'DEPOSIT',
  'WITHDRAWAL',
  'CORRECTION',
] as const;
export type ManualEntryType = (typeof MANUAL_ENTRY_TYPES)[number];

export const LEDGER_SORT_FIELDS = [
  'occurredAt',
  'amount',
  'createdAt',
] as const;
export type LedgerSortField = (typeof LEDGER_SORT_FIELDS)[number];

export interface AccountBalance {
  accountCode: string;
  label: string;
  /** Sum of every row on this account for the store; may be negative. */
  balance: number;
}

export interface BalanceSummary {
  accounts: AccountBalance[];
  total: number;
}

export interface LedgerFilter {
  storeId: string;
  accountCode?: string;
  typeCode?: string;
  from?: Date;
  to?: Date;
  sort: LedgerSortField;
  dir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/**
 * One signed row ready to append. The sole write shape: manual entries and
 * transfers build it in 2a; 2b's automatic posters (sale, refund, ...) build
 * the same shape and call `LedgerService.post(post, tx)` inside their own
 * transaction so the sale and its ledger rows commit atomically.
 */
export interface LedgerPost {
  storeId: string;
  accountCode: string;
  typeCode: string;
  /** Signed, non-zero: positive = money in, negative = money out. */
  amount: number;
  occurredAt?: Date;
  note?: string;
  transferId?: string;
  createdById: string;
}
