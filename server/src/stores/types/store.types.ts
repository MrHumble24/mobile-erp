/** Human-facing store identity, shown on receipts and the app shell. */
export interface StoreIdentity {
  name: string;
  address: string | null;
  phone: string | null;
}
