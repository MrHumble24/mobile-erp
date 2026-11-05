import type { AttributeDef } from '../lib/attribute-schema.js';

/** Catalog model projection returned to clients. */
export interface DeviceModelView {
  id: string;
  brand: string;
  name: string;
  isActive: boolean;
  /** How customs writes this model; used to match a price-list fee (ADR 0027). */
  customsCode: string | null;
  attributes: AttributeDef[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceModelInput {
  brand: string;
  name: string;
  customsCode?: string | null;
  attributes: AttributeDef[];
}

export interface DeviceModelPatch {
  brand?: string;
  name?: string;
  isActive?: boolean;
  customsCode?: string | null;
  attributes?: AttributeDef[];
}
