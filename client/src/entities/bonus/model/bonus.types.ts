/** One row of a customer's points history (server `BonusHistoryRow`). */
export interface BonusHistoryRow {
  id: string
  /** EARN, SPEND, RETURN or CORRECTION. */
  typeCode: string
  /** Signed: positive = points in, negative = points out. */
  amount: string
  occurredAt: string
  note: string | null
  saleId: string | null
  createdBy: { id: string; name: string } | null
}

/** A customer's bonus balance + history + the store's live config echo. */
export interface CustomerBonus {
  customerId: string
  enabled: boolean
  earnPercent: string
  maxRedeemPercent: string
  balance: string
  history: BonusHistoryRow[]
}

/** Owner manual correction: signed points and a required reason. */
export interface AdjustBonusDto {
  amount: number
  reason: string
}
