/** Human-facing store identity, shown on receipts and the app shell. */
export interface StoreIdentity {
  name: string;
  address: string | null;
  phone: string | null;
}

/** Full store projection returned to clients. */
export interface StoreView {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
