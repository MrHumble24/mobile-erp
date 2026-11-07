import { isUniqueViolation } from '../../common/lib/prisma-errors.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import type { RepairIdempotency } from '../repair-idempotency.service.js';
import type { RepairsReadService } from '../repairs-read.service.js';
import type { RepairView } from '../types/repair.types.js';

/**
 * Resolve a duplicate-key collision to the ticket that already committed, or
 * null when the error is not an idempotency replay. A P2002 on the mutation key
 * means a concurrent duplicate of this submit won the race; the losing write
 * rolled back, so the winner's ticket is the result to return.
 */
export async function replayDuplicate(
  error: unknown,
  idem: RepairIdempotency,
  read: RepairsReadService,
  caller: AuthenticatedUser,
  key: string | undefined,
): Promise<RepairView | null> {
  if (!isUniqueViolation(error) || !key) return null;
  const repairId = await idem.findRepairIdByKey(key);
  if (!repairId) return null;
  return read.get(caller, repairId);
}

/**
 * Run a repair write and return the fresh ticket view. The write closure starts
 * its own transaction and records the mutation key inside it. On a duplicate
 * key we replay the committed ticket instead of surfacing the P2002.
 */
export async function commitMutation(
  idem: RepairIdempotency,
  read: RepairsReadService,
  caller: AuthenticatedUser,
  key: string | undefined,
  repairId: string,
  write: () => Promise<void>,
): Promise<RepairView> {
  try {
    await write();
  } catch (error) {
    const replayed = await replayDuplicate(error, idem, read, caller, key);
    if (replayed) return replayed;
    throw error;
  }
  return read.get(caller, repairId);
}
