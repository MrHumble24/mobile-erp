import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';

export interface MutationContext {
  caller: AuthenticatedUser;
  /** The client mutation id (= the queue entry id), used as the idempotency key. */
  mutationId: string;
  /** Device version the terminal saw; enforced as the optimistic lock. */
  baseVersion?: number;
}

/**
 * One mutation type (sale.create, consignment.settle, …). Owns its permission
 * code, its validation DTO, replay detection, the dispatch, and the device whose
 * version a conflict is logged against. New type = new file, no switch chains.
 */
export interface SyncHandler<D extends object = object> {
  readonly permission: string;
  readonly dtoClass: new () => D;
  /** A prior record when this exact mutation already applied, else null. */
  findExisting(ctx: MutationContext, dto: D): Promise<unknown>;
  /** Applies the mutation; throws ConflictException on a version/state clash. */
  apply(ctx: MutationContext, dto: D): Promise<unknown>;
  /** The contended device, for the sync_conflicts row; null if unresolvable. */
  deviceId(dto: D): Promise<string | null>;
}
