import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';
import type { RepairView } from './types/repair.types.js';

/**
 * Idempotency for repair writes. A client-supplied `clientMutationId` is
 * recorded in the same transaction as the write, so a retried (or concurrent
 * duplicate) submit can replay the original ticket instead of writing twice.
 * Also the seam a later sync handler checkpoint will reuse to find / replay a
 * mutation by key.
 */
@Injectable()
export class RepairIdempotency {
  constructor(
    private readonly writes: RepairsWriteRepository,
    private readonly read: RepairsReadService,
  ) {}

  /** The repair a mutation key already produced, or null when it is new. */
  findRepairIdByKey(key: string): Promise<string | null> {
    return this.writes.findMutationRepairId(key);
  }

  /** Replay the ticket for an already-seen key; null when there is nothing to
   * replay (no key, or the key is new). */
  async replay(
    caller: AuthenticatedUser,
    key?: string,
  ): Promise<RepairView | null> {
    if (!key) return null;
    const repairId = await this.findRepairIdByKey(key);
    if (!repairId) return null;
    return this.read.get(caller, repairId);
  }

  /** Record the key inside the write's transaction. No key = no-op; a unique
   * violation is allowed to propagate so the caller can replay. */
  async record(
    tx: PrismaTx,
    key: string | undefined,
    repairId: string,
    kind: string,
  ): Promise<void> {
    if (!key) return;
    await this.writes.recordMutation(tx, key, repairId, kind);
  }
}
