import { BadRequestException } from '@nestjs/common';
import type { ManualEntryType } from '../types/ledger.types.js';

/**
 * The sign convention for a manual entry, validated in one place:
 *  - DEPOSIT / WITHDRAWAL: client sends a positive magnitude; the server signs
 *    it (withdrawal negative, deposit positive). A negative magnitude is a bug.
 *  - OPENING / CORRECTION: the amount is already signed and passes through.
 *  - CORRECTION must carry a note (the reason); any amount must be non-zero.
 */
export function signedManualAmount(
  type: ManualEntryType,
  amount: number,
  note?: string,
): number {
  if (amount === 0) throw new BadRequestException('amount cannot be zero');
  if (type === 'CORRECTION' && !note?.trim()) {
    throw new BadRequestException('CORRECTION requires a note (the reason)');
  }
  if (type === 'DEPOSIT' || type === 'WITHDRAWAL') {
    if (amount < 0) {
      throw new BadRequestException(
        `${type} takes a positive amount; the server applies the sign`,
      );
    }
    return type === 'WITHDRAWAL' ? -amount : amount;
  }
  return amount;
}
