import { Injectable } from '@nestjs/common';

export type DestructiveOp = 'wipe' | 'restore' | 'reset';

/**
 * One process-wide latch for "a destructive whole-database operation is
 * running". A restore and a data wipe both take it synchronously (before any
 * `await`), so they can never overlap on the same database; it is released in a
 * `finally`. A manual or scheduled backup consults it too and stands down while
 * it is held — except the safety backup made *inside* an erase or a restore,
 * which bypasses it (the operation already holds the latch).
 *
 * In-memory and single-instance by design (ADR 0051/0057): one process owns the
 * maintenance switch and this latch. Cross-restart safety is the recovery
 * marker's job, not this one's.
 */
@Injectable()
export class DestructiveLockService {
  private holder: DestructiveOp | null = null;

  /** Take the latch if free. Synchronous check-and-set: two callers in the same
   * tick cannot both win. Returns false if another op already holds it. */
  tryAcquire(op: DestructiveOp): boolean {
    if (this.holder) return false;
    this.holder = op;
    return true;
  }

  release(): void {
    this.holder = null;
  }

  isHeld(): boolean {
    return this.holder !== null;
  }

  heldBy(): DestructiveOp | null {
    return this.holder;
  }
}
