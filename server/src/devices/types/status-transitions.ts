/**
 * Allowed device status transitions. Data-driven: add a row to change the
 * state machine, never an `if`. Keep in sync with seeded `device_statuses`.
 */
export const DEVICE_STATUS_TRANSITIONS: ReadonlyArray<
  readonly [string, string]
> = [
  ['IN_STOCK', 'DEFECTIVE'],
  ['DEFECTIVE', 'IN_STOCK'],
  ['IN_STOCK', 'CONSIGNED'],
  ['CONSIGNED', 'IN_STOCK'],
  ['IN_STOCK', 'SOLD'],
  ['CONSIGNED', 'SOLD'],
  ['SOLD', 'IN_STOCK'],
  ['SOLD', 'DEFECTIVE'],
];

const ALLOWED = new Set(
  DEVICE_STATUS_TRANSITIONS.map(([from, to]) => `${from}->${to}`),
);

export function isAllowedTransition(from: string, to: string): boolean {
  return ALLOWED.has(`${from}->${to}`);
}
