/**
 * The repair ticket state machine (ADR 0040). Legal moves only; anything else
 * is refused 409. GIVEN_BACK and CANCELLED are terminal — no move leaves them.
 */

export const REPAIR_STATUSES = [
  'RECEIVED',
  'IN_REPAIR',
  'READY',
  'GIVEN_BACK',
  'CANCELLED',
] as const;
export type RepairStatusCode = (typeof REPAIR_STATUSES)[number];

const MOVES: Record<string, readonly string[]> = {
  RECEIVED: ['IN_REPAIR', 'READY', 'CANCELLED'],
  IN_REPAIR: ['READY', 'RECEIVED', 'CANCELLED'],
  READY: ['GIVEN_BACK', 'IN_REPAIR', 'CANCELLED'],
  GIVEN_BACK: [],
  CANCELLED: [],
};

const TERMINAL: ReadonlySet<string> = new Set(['GIVEN_BACK', 'CANCELLED']);

export function isLegalMove(from: string, to: string): boolean {
  return (MOVES[from] ?? []).includes(to);
}

export function isTerminal(code: string): boolean {
  return TERMINAL.has(code);
}
