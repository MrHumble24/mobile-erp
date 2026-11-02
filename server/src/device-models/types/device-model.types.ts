import type { AttributeDef } from '../lib/attribute-schema.js';

/** Catalog model projection returned to clients. */
export interface DeviceModelView {
  id: string;
  brand: string;
  name: string;
  isActive: boolean;
  attributes: AttributeDef[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceModelInput {
  brand: string;
  name: string;
  attributes: AttributeDef[];
}

export interface DeviceModelPatch {
  brand?: string;
  name?: string;
  isActive?: boolean;
  attributes?: AttributeDef[];
}
