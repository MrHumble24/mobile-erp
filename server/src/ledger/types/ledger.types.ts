import type { Prisma } from '../../generated/client/client.js';

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

/**
 * Transaction types whose `amount` reveals a device cost (purchase, overhead,
 * per-phone expense, customs fee). The ledger history nulls these amounts for a
 * caller without the cost permission, since the generic interceptor cannot see
 * a field named `amount`. Kept here, next to the type lookup.
 */
export const COST_TYPE_CODES: ReadonlySet<string> = new Set([
  'PURCHASE',
  'OVERHEAD',
  'DEVICE_EXPENSE',
  'CUSTOMS',
]);

export interface AccountBalance {
  accountCode: string;
  label: string;
  /** Sum of every row on this account, as a 2-dp decimal string; may be negative. */
  balance: string;
}

export interface BalanceSummary {
  accounts: AccountBalance[];
  /** Sum of every account, as a 2-dp decimal string. */
  total: string;
}

/** One account's balance at the day's start and now, for the Telegram digest. */
export interface DigestAccountBalance {
  accountCode: string;
  label: string;
  /** Sum of rows before the day boundary, 2-dp string. */
  opening: string;
  /** Sum of all rows up to now, 2-dp string. */
  closing: string;
}

export interface DigestBalances {
  accounts: DigestAccountBalance[];
  openingTotal: string;
  closingTotal: string;
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

/** A single money column linking a cash row back to what moved it. */
export type LedgerSourceField =
  'saleId' | 'expenseId' | 'partnerPaymentId' | 'deviceId' | 'shipmentId';

/**
 * One signed row ready to append. The sole write shape: manual entries and
 * transfers build it in 2a; 2b's automatic posters (sale, refund, ...) build
 * the same shape and call `LedgerService.post(post, tx)` inside their own
 * transaction so the source row and its ledger rows commit atomically.
 */
export interface LedgerPost {
  storeId: string;
  accountCode: string;
  typeCode: string;
  /** Signed, non-zero: positive = money in, negative = money out. */
  amount: Prisma.Decimal | number;
  occurredAt?: Date;
  note?: string;
  transferId?: string;
  /** At most one source link is set (saleId, expenseId, ...). */
  saleId?: string;
  expenseId?: string;
  partnerPaymentId?: string;
  deviceId?: string;
  shipmentId?: string;
  /** Ties a CREDIT_PAYMENT row to its credit payment (ADR 0035). */
  creditPaymentId?: string;
  createdById: string;
}

/** Net of a source's rows on one account (money in positive, out negative). */
export interface AccountNet {
  accountCode: string;
  amount: Prisma.Decimal;
}
