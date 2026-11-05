import { Prisma } from '../../generated/client/client.js';
import type { ShiftRow } from '../shifts.repository.js';
import type {
  ShiftCashier,
  ShiftListItem,
  ShiftReportView,
} from '../types/shift.types.js';
import { summariseShift, type ShiftRow as MovementRow } from './shift-math.js';

function cashier(row: ShiftRow): ShiftCashier {
  const p = row.cashier.profile;
  return {
    id: row.cashier.id,
    name: p ? [p.firstName, p.lastName].filter(Boolean).join(' ') : '',
  };
}

/** A shift plus its full figures, from the shift row and its window's cash rows. */
export function toReportView(
  row: ShiftRow,
  movements: MovementRow[],
): ShiftReportView {
  const summary = summariseShift(row.openingCount, row.closingCount, movements);
  return {
    ...summary,
    id: row.id,
    cashier: cashier(row),
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    note: row.note,
  };
}

/** A light list row; `difference` is the shift's own SHIFT_DIFFERENCE total. */
export function toListItem(
  row: ShiftRow,
  difference: Prisma.Decimal | undefined,
): ShiftListItem {
  return {
    id: row.id,
    cashier: cashier(row),
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    openingCount: row.openingCount.toFixed(2),
    closingCount: row.closingCount ? row.closingCount.toFixed(2) : null,
    // Open shift: unknown yet. Closed with no correction: exactly 0.00.
    difference: row.closedAt
      ? (difference ?? new Prisma.Decimal(0)).toFixed(2)
      : null,
  };
}
