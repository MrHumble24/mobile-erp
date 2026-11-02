import { Prisma } from '../../generated/client/client.js';
import { LedgerEntry } from '../types/partner.types.js';

export interface ConsignmentLedgerRow {
  id: string;
  agreedPrice: Prisma.Decimal;
  consignedAt: Date;
  statusCode: string;
  resolvedAt: Date | null;
  notes: string | null;
}

export interface PaymentLedgerRow {
  id: string;
  amount: Prisma.Decimal;
  paidAt: Date;
  notes: string | null;
}

/**
 * Chronological ledger with running balance: charge each consignment at
 * consignedAt, reverse a RETURNED one at resolvedAt, credit each payment. Pure
 * — the running-balance maths is testable without a database.
 */
export function buildLedger(
  consignments: ConsignmentLedgerRow[],
  payments: PaymentLedgerRow[],
): LedgerEntry[] {
  const events: Omit<LedgerEntry, 'runningBalance'>[] = [];
  for (const c of consignments) {
    events.push({
      at: c.consignedAt,
      kind: 'consignment',
      refId: c.id,
      change: c.agreedPrice,
      statusCode: c.statusCode,
      notes: c.notes,
    });
    if (c.statusCode === 'RETURNED' && c.resolvedAt) {
      events.push({
        at: c.resolvedAt,
        kind: 'consignment',
        refId: c.id,
        change: c.agreedPrice.negated(),
        statusCode: 'RETURNED',
        notes: c.notes,
      });
    }
  }
  for (const p of payments) {
    events.push({
      at: p.paidAt,
      kind: 'payment',
      refId: p.id,
      change: p.amount.negated(),
      statusCode: null,
      notes: p.notes,
    });
  }
  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  let running = new Prisma.Decimal(0);
  return events.map((e) => {
    running = running.plus(e.change);
    return { ...e, runningBalance: running };
  });
}
