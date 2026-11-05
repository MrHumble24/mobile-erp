import type { Prisma } from '../../generated/client/client.js';

type Decimal = Prisma.Decimal;

/** The store's bonus configuration (StoreSettings), read once per sale. */
export interface BonusConfig {
  enabled: boolean;
  earnPercent: Decimal;
  maxRedeemPercent: Decimal;
}

/** What a sale will post to the points ledger, resolved before its transaction. */
export interface BonusPlan {
  enabled: boolean;
  /** Validated points to spend on the sale (0 when none). */
  redeem: Decimal;
  earnPercent: Decimal;
}

/** One row of a customer's points history. */
export interface BonusHistoryRow {
  id: string;
  typeCode: string;
  /** Signed: positive = points in, negative = points out. */
  amount: string;
  occurredAt: Date;
  note: string | null;
  saleId: string | null;
  createdBy: { id: string; name: string } | null;
}

/** Customer bonus balance + history + the store's live config echo. */
export interface BonusView {
  customerId: string;
  enabled: boolean;
  earnPercent: string;
  maxRedeemPercent: string;
  balance: string;
  history: BonusHistoryRow[];
}
