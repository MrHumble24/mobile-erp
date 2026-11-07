/** Queue types; exactly the server's handler-registry keys. */
export const MUTATION_TYPES = {
  saleCreate: "sale.create",
  consignmentCreate: "consignment.create",
  consignmentSettle: "consignment.settle",
  consignmentReturn: "consignment.return",
  repairCreate: "repair.create",
  repairUpdate: "repair.update",
  repairStatus: "repair.status",
  repairPayment: "repair.payment",
  repairRefund: "repair.refund",
  repairOutside: "repair.outside",
  repairPartAdd: "repair.part.add",
  repairPartRemove: "repair.part.remove",
} as const

export type MutationType = (typeof MUTATION_TYPES)[keyof typeof MUTATION_TYPES]

export type OutboxStatus = "pending" | "rejected"

/** One queued write. `id` is the clientMutationId = server idempotency key. */
export interface OutboxEntry {
  id: string
  type: MutationType
  payload: Record<string, unknown>
  baseVersion?: number
  occurredAt: string
  status: OutboxStatus
  error?: string
  attempts: number
  storeId?: string
}

/** Mirrors the server's MutationResult (sync.types.ts). */
export type MutationResultStatus = "applied" | "duplicate" | "conflict" | "rejected"

export interface MutationResult {
  id: string
  status: MutationResultStatus
  conflictId?: string
  error?: string
}

export interface PushResponse {
  results: MutationResult[]
}

/** The server conflict row, enough to list and resolve it. */
export interface ConflictView {
  id: string
  deviceId: string
  imei: string | null
  serialNumber?: string | null
  terminalId: string
  attemptedChange: { type: string; payload: Record<string, unknown>; occurredAt: string; mutationId: string }
  baseVersion: number
  resolvedAt: string | null
  resolution: string | null
  createdAt: string
}

export interface ResolveConflictDto {
  resolution: "keep-server" | "apply-terminal"
  note?: string
}

/** A device row from GET /sync/changes — never carries cost fields. */
export interface DeviceChange {
  id: string
  imei: string | null
  imei2: string | null
  serialNumber: string | null
  statusCode: string
  version: number
  targetPrice: string | null
  specs: unknown
  model: {
    id: string
    brand: string
    name: string
    kindCode?: string
    /** Carried for the offline till catalog (ADR 0031). */
    categoryId?: string | null
    imageUrl?: string | null
  }
  latestSale: { id: string; soldAt: string; salePrice: string; warrantyEndsAt: string | null } | null
  latestInspection: { gradeCode: string | null; notes: string | null } | null
  updatedAt: string
}

export interface PartnerChange {
  id: string
  shopName: string
  phone: string | null
  creditLimit: string
  outstanding: string
}

/**
 * A quantity product from the changes feed (ADR 0030) — the full list each sync
 * so an offline till can sell it. Structural (not imported from entities/stock)
 * so the two entities stay independent. Never carries cost fields.
 */
export interface ProductChange {
  modelId: string
  brand: string
  name: string
  barcode: string | null
  salePrice: string | null
  quantity: number
  /** Carried for the offline till catalog (ADR 0031). */
  categoryId?: string | null
  imageUrl?: string | null
}

export interface ChangesResponse {
  serverTime: string
  nextSince: string | null
  devices: DeviceChange[]
  partners: PartnerChange[]
  products: ProductChange[]
}
