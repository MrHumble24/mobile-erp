/** Customer projection returned to clients. */
export interface CustomerView {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  /** Default price level for this customer (ADR 0034). */
  priceLevelCode: string;
  /** Standing discount percent on the card (2-dp string, "0.00" = none). */
  standingDiscountPercent: string;
  /** This customer's own credit ceiling (2-dp string); null = use the default. */
  creditLimit: string | null;
  createdAt: Date;
}

/** A customer plus purchase aggregates derived from their sales (not stored). */
export interface CustomerListItem extends CustomerView {
  purchaseCount: number;
  totalSpent: number;
  lastPurchaseAt: Date | null;
  activeWarranties: number;
  returnsCount: number;
  /** Credit position (ADR 0035): all derived, never stored. */
  creditOutstanding: string;
  creditOverdue: string;
  /** The limit actually enforced: own limit, else the settings default; null = no cap. */
  effectiveCreditLimit: string | null;
}

export interface CustomerPage {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Directory-wide summary tiles. */
export interface CustomerStats {
  total: number;
  newThisMonth: number;
  withPurchases: number;
  repeatBuyers: number;
}
