/** Customer projection returned to clients. */
export interface CustomerView {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
}

/** A customer plus purchase aggregates derived from their sales (not stored). */
export interface CustomerListItem extends CustomerView {
  purchaseCount: number;
  totalSpent: number;
  lastPurchaseAt: Date | null;
  activeWarranties: number;
  returnsCount: number;
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
