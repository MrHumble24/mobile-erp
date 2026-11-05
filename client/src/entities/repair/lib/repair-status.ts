/**
 * The repair ticket state machine (ADR 0040), mirroring the server. Legal moves
 * only; GIVEN_BACK and CANCELLED are terminal — no move leaves them. The server
 * is authoritative (409 on an illegal move); the UI only offers legal buttons.
 */

export const REPAIR_STATUSES = [
  "RECEIVED",
  "IN_REPAIR",
  "READY",
  "GIVEN_BACK",
  "CANCELLED",
] as const
export type RepairStatusCode = (typeof REPAIR_STATUSES)[number]

const MOVES: Record<string, readonly RepairStatusCode[]> = {
  RECEIVED: ["IN_REPAIR", "READY", "CANCELLED"],
  IN_REPAIR: ["READY", "RECEIVED", "CANCELLED"],
  READY: ["GIVEN_BACK", "IN_REPAIR", "CANCELLED"],
  GIVEN_BACK: [],
  CANCELLED: [],
}

const TERMINAL: ReadonlySet<string> = new Set(["GIVEN_BACK", "CANCELLED"])

/** The statuses `from` may legally move to (empty when terminal). */
export function allowedMoves(from: string): readonly RepairStatusCode[] {
  return MOVES[from] ?? []
}

export function isLegalMove(from: string, to: string): boolean {
  return allowedMoves(from).includes(to as RepairStatusCode)
}

export function isTerminal(code: string): boolean {
  return TERMINAL.has(code)
}
