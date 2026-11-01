/** Catalog model projection returned to clients. */
export interface DeviceModelView {
  id: string;
  brand: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceModelPatch {
  brand?: string;
  name?: string;
  isActive?: boolean;
}
