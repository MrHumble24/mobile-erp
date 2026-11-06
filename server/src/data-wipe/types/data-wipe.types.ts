/** Stable error codes the client maps to messages (never a raw secret/SQL). */
export const DATA_WIPE_CONFIRM_FAILED = 'DATA_WIPE_CONFIRM_FAILED';
export const DATA_WIPE_RUNNING = 'DATA_WIPE_RUNNING';
export const DATA_WIPE_NO_PASSPHRASE = 'DATA_WIPE_NO_PASSPHRASE';
export const DATA_WIPE_PASSPHRASE_UNREADABLE =
  'DATA_WIPE_PASSPHRASE_UNREADABLE';
export const DATA_WIPE_SAFETY_BACKUP_FAILED = 'DATA_WIPE_SAFETY_BACKUP_FAILED';

/** Row counts each group would erase right now (for the confirm dialog). */
export interface WipePreview {
  always: number;
  contacts: number;
  catalog: number;
}

/** Live status the "please wait" overlay polls (same shape as restore status). */
export interface WipeStatusView {
  wiping: boolean;
  needsManualRecovery: boolean;
  last: {
    status: string;
    startedAt: string;
    finishedAt: string | null;
    error: string | null;
  } | null;
}

/** One past erase, for the record under the danger-zone card. */
export interface WipeRunView {
  id: string;
  performedById: string;
  /** The performer's email, resolved for display (null if the user is gone). */
  performedByEmail: string | null;
  contacts: boolean;
  catalog: boolean;
  safetyRunId: string | null;
  rowsErased: Record<string, number>;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  error: string | null;
}
