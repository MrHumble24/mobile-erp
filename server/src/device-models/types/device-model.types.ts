import type { AttributeDef } from '../lib/attribute-schema.js';

/** Catalog model projection returned to clients. */
export interface DeviceModelView {
  id: string;
  brand: string;
  name: string;
  isActive: boolean;
  /** Stock kind: IMEI | SERIAL | QUANTITY (ADR 0029). */
  kindCode: string;
  /** Optional product grouping. */
  categoryId: string | null;
  /** EAN printed on the box; unique when set. */
  barcode: string | null;
  /** Maker's code (Apple A2894 / Samsung SM-S918B); indexed, not unique. */
  modelCode: string | null;
  /** How customs writes this model; used to match a price-list fee (ADR 0027). */
  customsCode: string | null;
  attributes: AttributeDef[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceModelInput {
  brand: string;
  name: string;
  kindCode: string;
  categoryId?: string | null;
  barcode?: string | null;
  modelCode?: string | null;
  customsCode?: string | null;
  attributes: AttributeDef[];
}

export interface DeviceModelPatch {
  brand?: string;
  name?: string;
  isActive?: boolean;
  kindCode?: string;
  categoryId?: string | null;
  barcode?: string | null;
  modelCode?: string | null;
  customsCode?: string | null;
  attributes?: AttributeDef[];
}
