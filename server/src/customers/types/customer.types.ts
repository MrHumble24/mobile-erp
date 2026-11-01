/** Customer projection returned to clients. */
export interface CustomerView {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
}
