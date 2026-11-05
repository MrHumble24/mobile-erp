import type { PaymentMethod, PaymentPart } from "@/entities/ledger"
import type { CreditTenderDto } from "@/entities/credit"
import { toCents } from "@/entities/credit"

/**
 * The down-payment tender lines for `POST /credits.payments` (ADR 0035): empty
 * when nothing is paid now, one CASH/CARD line of the amount, or the balanced
 * split parts. Each positive line only; the server rejects zero amounts.
 */
export function downPaymentParts(
  method: PaymentMethod,
  amount: number,
  splitParts: PaymentPart[]
): CreditTenderDto[] {
  if (method === "split") {
    return splitParts
      .filter((p) => p.amount > 0)
      .map((p) => ({ accountCode: p.accountCode, amount: p.amount }))
  }
  if (amount <= 0) return []
  return [{ accountCode: method === "card" ? "CARD" : "CASH", amount }]
}

/** True when a split down payment's parts do not add up to the typed amount. */
export function isDownPaymentUnbalanced(
  method: PaymentMethod,
  amount: number,
  splitParts: PaymentPart[]
): boolean {
  if (method !== "split") return false
  const assigned = splitParts.reduce((sum, p) => sum + toCents(p.amount), 0)
  return assigned !== toCents(amount)
}
