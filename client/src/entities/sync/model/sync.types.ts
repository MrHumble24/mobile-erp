/** The four queue types; exactly the server's handler-registry keys. */
export const MUTATION_TYPES = {
  saleCreate: "sale.create",
  consignmentCreate: "consignment.create",
  consignmentSettle: "consignment.settle",
  consignmentReturn: "consignment.return",
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
  imei: string
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
  imei: string
  statusCode: string
  version: number
  targetPrice: string | null
  specs: unknown
  model: { id: string; brand: string; name: string }
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

export interface ChangesResponse {
  serverTime: string
  nextSince: string | null
  devices: DeviceChange[]
  partners: PartnerChange[]
}
