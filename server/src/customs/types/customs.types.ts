export interface PriceListItemInput {
  customsCode: string;
  description?: string;
  fee: number;
}

export interface CreatePriceListInput {
  effectiveAt?: Date;
  note?: string;
  items: PriceListItemInput[];
  createdById: string;
}

/** One price-list version in the history list. */
export interface PriceListSummary {
  id: string;
  effectiveAt: Date;
  note: string | null;
  createdById: string;
  createdAt: Date;
  itemCount: number;
}

/** A current-list row, with the previous version's fee for the same code. */
export interface CurrentListItem {
  customsCode: string;
  description: string | null;
  fee: string;
  /** The previous version's fee for this code, or null if it is new. */
  previousFee: string | null;
  /** True when at least one of our device models carries this customsCode. */
  usedByModel: boolean;
}

/** The current (newest) list; `null` when no list exists yet. */
export interface CurrentList {
  id: string;
  effectiveAt: Date;
  note: string | null;
  items: CurrentListItem[];
}

/** One point of a code's fee over time, for a trend chart. */
export interface FeeHistoryPoint {
  listId: string;
  effectiveAt: Date;
  fee: string;
}

/** A model whose customs fee cannot be stamped from the current list. */
export interface UnmatchedModel {
  id: string;
  brand: string;
  name: string;
  customsCode: string | null;
  reason: 'MISSING_CODE' | 'CODE_NOT_IN_CURRENT_LIST';
}
