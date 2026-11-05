import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { accountLabel } from "../lib/ledger-labels"

export interface PaymentSummaryProps {
  payments: { accountCode: string; amount: string | number }[]
  /** Prefix the line with the "Paid with" label. */
  withLabel?: boolean
  className?: string
}

/** Compact read-out of how a sale was tendered: "Cash $600 · Card $400".
 *  Renders nothing for an empty list. */
export function PaymentSummary({ payments, withLabel, className }: PaymentSummaryProps) {
  const { t } = useI18n()
  if (!payments || payments.length === 0) return null
  const parts = payments.map(
    (p) => `${accountLabel(p.accountCode, undefined, t)} ${formatMoney(p.amount)}`
  )
  return (
    <span className={className}>
      {withLabel ? `${t("balance.paidWith")}: ` : ""}
      {parts.join(" · ")}
    </span>
  )
}
