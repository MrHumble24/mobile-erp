/** Rows each group would erase right now (for the confirm dialog). */
export interface WipePreview {
  always: number
  contacts: number
  catalog: number
}

/** Live status the overlay polls while an erase runs (same shape as restore). */
export interface WipeStatusView {
  wiping: boolean
  needsManualRecovery: boolean
  last: {
    status: string
    startedAt: string
    finishedAt: string | null
    error: string | null
  } | null
}

/** One past erase, for the record under the danger-zone card. */
export interface WipeRunView {
  id: string
  performedById: string
  performedByEmail: string | null
  contacts: boolean
  catalog: boolean
  safetyRunId: string | null
  rowsErased: Record<string, number>
  startedAt: string
  finishedAt: string | null
  status: string
  error: string | null
}

export interface WipeRequestDto {
  shopName: string
  password: string
  understood: true
  contacts: boolean
  catalog: boolean
}
