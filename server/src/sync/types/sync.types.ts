/** Outcome of a single queued mutation processed by POST /sync/push. */
export type MutationStatus = 'applied' | 'duplicate' | 'conflict' | 'rejected';

/**
 * Rejection reason for a mutation queued before the last erase or restore. The
 * client treats this exact string as "drop it, do not retry" (it belongs to the
 * shop as it was before the reset). Contract shared with the web client's
 * `drain.ts`.
 */
export const MUTATION_BEFORE_RESET = 'MUTATION_BEFORE_RESET';

export interface MutationResult {
  id: string;
  status: MutationStatus;
  record?: unknown;
  conflictId?: string;
  error?: string;
}

export interface PushResponse {
  results: MutationResult[];
}

/** The mutation as stored in a conflict row, enough to re-dispatch it later. */
export interface StoredMutation {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  mutationId: string;
}

export interface ConflictView {
  id: string;
  deviceId: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  terminalId: string;
  attemptedChange: StoredMutation;
  baseVersion: number;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
}

export interface DeviceChange {
  id: string;
  imei: string | null;
  imei2: string | null;
  serialNumber: string | null;
  statusCode: string;
  version: number;
  targetPrice: string | null;
  specs: unknown;
  /** imageUrl + categoryId let an offline till draw the product grid (ADR 0031). */
  model: {
    id: string;
    brand: string;
    name: string;
    kindCode: string;
    categoryId: string | null;
    imageUrl: string | null;
  };
  latestSale: {
    id: string;
    soldAt: Date;
    salePrice: string;
    warrantyEndsAt: Date | null;
  } | null;
  latestInspection: { gradeCode: string | null; notes: string | null } | null;
  /** Resolved list price per level so an offline till can switch level (ADR 0034). */
  prices: Record<string, string | null>;
  updatedAt: Date;
}

export interface PartnerChange {
  id: string;
  shopName: string;
  phone: string | null;
  creditLimit: string;
  outstanding: string;
}

/** A quantity product an offline till can sell: its stock and default price. */
export interface QuantityProductChange {
  modelId: string;
  brand: string;
  name: string;
  barcode: string | null;
  salePrice: string | null;
  quantity: number;
  /** For the offline grid (ADR 0031). */
  categoryId: string | null;
  imageUrl: string | null;
  /** Resolved list price per level (ADR 0034). */
  prices: Record<string, string | null>;
}

/** Offline-cache feed. nextSince is set only when the device page was capped. */
export interface ChangesResponse {
  serverTime: string;
  nextSince: string | null;
  devices: DeviceChange[];
  partners: PartnerChange[];
  /** QUANTITY products with their current stock (ADR 0030). */
  products: QuantityProductChange[];
}
