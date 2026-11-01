/** Supplier projection returned to clients. */
export interface SupplierView {
  id: string;
  name: string;
  country: string | null;
  contact: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInput {
  name: string;
  country?: string;
  contact?: string;
  notes?: string;
}

export interface SupplierPatch {
  name?: string;
  country?: string;
  contact?: string;
  notes?: string;
  isActive?: boolean;
}
