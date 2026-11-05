import type { ShiftSummary } from '../lib/shift-math.js';

export interface ShiftCashier {
  id: string;
  name: string;
}

/** A shift plus its full computed figures (ADR 0036). Returned by open / close /
 * current / report. For an open shift `closedAt`, `countedCash` and
 * `difference` are null and the figures are live (expected cash so far). */
export interface ShiftReportView extends ShiftSummary {
  id: string;
  cashier: ShiftCashier;
  openedAt: string;
  closedAt: string | null;
  note: string | null;
}

/** A light row for the shifts list. `difference` comes from the shift's own
 * SHIFT_DIFFERENCE ledger row (0.00 when closed with no correction, null while
 * still open) — never recomputed per row. */
export interface ShiftListItem {
  id: string;
  cashier: ShiftCashier;
  openedAt: string;
  closedAt: string | null;
  openingCount: string;
  closingCount: string | null;
  difference: string | null;
}

export interface ShiftListResult {
  items: ShiftListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ShiftListFilter {
  storeId: string;
  cashierId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}
