/** Credit for the list that answered, shown to the user (ADR 0031). */
export interface LookupSource {
  name: string;
  license: string;
}

/** What the reference list knows about individual variants (e.g. for Apple A-numbers). */
export interface LookupVariant {
  color: string | null;
  storage: string | null;
  ram: string | null;
  boxCode: string | null;
}

/** What the reference list knows about the code. */
export interface LookupReference {
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
  modelNumber?: string | null;
  modelCode?: string | null;
  storageOptions?: string[];
  colorOptions?: string[];
  variants?: LookupVariant[];
}

/** How our catalog product was found (in resolution order). */
export type LookupMatch = 'link' | 'modelCode' | 'name';

/** Our catalog product for the code, when one could be determined. */
export interface LookupProduct {
  modelId: string;
  brand: string;
  name: string;
  kindCode: string;
  matchedBy: LookupMatch;
  /** The product's own option matching the reference value, or null. */
  storageOption: string | null;
  colorOption: string | null;
}

export interface LookupResult {
  source: LookupSource;
  reference: LookupReference;
  product: LookupProduct | null;
}

export interface LookupSearchResult {
  brand: string;
  model: string;
  series?: string | null;
  modelCode?: string | null;
  kindCode: 'IMEI' | 'SERIAL' | 'QUANTITY';
  storageOptions: string[];
  colorOptions: string[];
}
