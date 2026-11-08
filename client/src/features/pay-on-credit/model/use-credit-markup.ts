import * as React from "react"
import { fromCents, toCents } from "@/entities/credit"

export type MarkupMode = "percent" | "amount"

/**
 * The optional, fixed Murabaha margin (ADR 0068): one disclosed amount agreed
 * up front, expressed either as a rate of the cash price or as a fixed sum.
 * Both modes show the same resulting margin; switching keeps it. Money is
 * cent-exact so the agreed price the plan must sum to never drifts.
 *
 * It is NOT interest: it is set once, capped at the cash price, and never grows.
 */
export function useCreditMarkup(cashTotal: number) {
  const cashCents = toCents(cashTotal)
  const [mode, setMode] = React.useState<MarkupMode>("percent")
  const [percent, setPercent] = React.useState(0)
  const [amount, setAmount] = React.useState(0)

  const markupCents =
    mode === "percent"
      ? Math.round((cashCents * percent) / 100)
      : toCents(amount)
  const markup = fromCents(markupCents)
  const agreedTotal = fromCents(cashCents + markupCents)
  const effectivePercent =
    cashCents > 0 ? Math.round((markupCents / cashCents) * 10000) / 100 : 0

  const changeMode = (next: MarkupMode) => {
    if (next === mode) return
    // Carry the current margin across so switching never silently changes it.
    if (next === "percent") setPercent(effectivePercent)
    else setAmount(markup)
    setMode(next)
  }

  const changePercent = (value: number) =>
    setPercent(Math.min(100, Math.max(0, value)))
  const changeAmount = (value: number) =>
    setAmount(Math.min(fromCents(cashCents), Math.max(0, value)))

  return {
    mode,
    changeMode,
    percent,
    changePercent,
    amount,
    changeAmount,
    markup,
    agreedTotal,
    cashTotal: fromCents(cashCents),
    effectivePercent,
  }
}
