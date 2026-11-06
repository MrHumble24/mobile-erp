import type { SaleBonus } from "../model/sale.types.ts"
import { formatNumber } from "../../../shared/lib/format.ts"

/** One optional points line on a receipt (ADR 0043). */
export interface ReceiptBonusLine {
  key: "paidWithPoints" | "pointsEarned"
  label: string
  /** Points, not money: already formatted with `formatNumber`. */
  amount: string
  /** True for the spent line, printed with a minus sign like a tender. */
  negative: boolean
}

export interface ReceiptBonusLines {
  paidWithPoints: ReceiptBonusLine | null
  pointsEarned: ReceiptBonusLine | null
}

/**
 * The receipt's points lines, in order: what was paid with points, then what
 * the sale earned. Both are null when their figure is zero, so a sale without
 * points prints exactly the old receipt (ADR 0043).
 */
export function receiptBonusLines(
  bonus: SaleBonus | null | undefined,
  t: (key: string) => string
): ReceiptBonusLines {
  const spent = bonus?.spent ?? "0.00"
  const earned = bonus?.earned ?? "0.00"
  return {
    paidWithPoints:
      Number(spent) > 0
        ? {
            key: "paidWithPoints",
            label: t("sales.paidWithPoints"),
            amount: formatNumber(spent),
            negative: true,
          }
        : null,
    pointsEarned:
      Number(earned) > 0
        ? {
            key: "pointsEarned",
            label: t("sales.pointsEarned"),
            amount: formatNumber(earned),
            negative: false,
          }
        : null,
  }
}
