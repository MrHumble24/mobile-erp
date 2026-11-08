import * as React from "react"
import type { PaymentMethod, PaymentPart } from "@/entities/ledger"
import {
  buildEvenPlan,
  planRemainingCents,
  isPastDue,
  toCents,
  toDateInput,
  type CreditInstalmentDto,
  type CreditTenderDto,
  type PlanFrequency,
} from "@/entities/credit"
import { downPaymentParts, isDownPaymentUnbalanced } from "../lib/down-payment"

export interface InstalmentDraft {
  dueDate: string
  amount: number
}

/** One month from today, in UTC — the default first due date. */
function defaultFirstDue(): string {
  const d = new Date()
  return toDateInput(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())))
}

/**
 * The credit draft (ADR 0035): a down payment and a payment plan the seller
 * either fills evenly or edits by hand. All plan arithmetic is cent-exact via
 * the entity's pure helpers so the till blocks before the server does.
 */
export function useCreditDraft(dueTotal: number) {
  const first = React.useMemo(defaultFirstDue, [])
  const [downPayment, setDownPaymentState] = React.useState(0)
  const [method, setMethodState] = React.useState<PaymentMethod>("cash")
  const [splitParts, setSplitParts] = React.useState<PaymentPart[]>([])
  const [parts, setPartsState] = React.useState(1)
  const [firstDue, setFirstDueState] = React.useState(first)
  const [frequency, setFrequencyState] = React.useState<PlanFrequency>("month")
  const [instalments, setInstalments] = React.useState<InstalmentDraft[]>(() => [
    { dueDate: first, amount: dueTotal },
  ])

  const setMethod = (next: PaymentMethod) => {
    setMethodState(next)
    if (next === "split") setSplitParts([{ accountCode: "CASH", amount: downPayment }])
  }

  const setParts = (nextParts: number) => {
    const validParts = Math.max(1, Math.trunc(nextParts || 1))
    setPartsState(validParts)
    const plan = buildEvenPlan(toCents(dueTotal) - toCents(downPayment), validParts, firstDue, frequency)
    if (plan.length > 0) setInstalments(plan)
  }

  const setDownPayment = (nextDown: number) => {
    const validDown = Math.max(0, Math.min(dueTotal, nextDown || 0))
    setDownPaymentState(validDown)
    const plan = buildEvenPlan(toCents(dueTotal) - toCents(validDown), parts, firstDue, frequency)
    if (plan.length > 0) setInstalments(plan)
  }

  const setFrequency = (nextFreq: PlanFrequency) => {
    setFrequencyState(nextFreq)
    const plan = buildEvenPlan(toCents(dueTotal) - toCents(downPayment), parts, firstDue, nextFreq)
    if (plan.length > 0) setInstalments(plan)
  }

  const setFirstDue = (nextDue: string) => {
    setFirstDueState(nextDue)
    const plan = buildEvenPlan(toCents(dueTotal) - toCents(downPayment), parts, nextDue, frequency)
    if (plan.length > 0) setInstalments(plan)
  }

  const applyEven = () => {
    const plan = buildEvenPlan(toCents(dueTotal) - toCents(downPayment), parts, firstDue, frequency)
    if (plan.length > 0) setInstalments(plan)
  }

  // When the AGREED price changes (a disclosed margin is applied or removed),
  // regenerate the even split so the plan still adds up and the cashier cannot
  // sell a stale total. Manual row edits survive until the price changes.
  const lastTotal = React.useRef(dueTotal)
  React.useEffect(() => {
    if (lastTotal.current === dueTotal) return
    lastTotal.current = dueTotal
    setInstalments((rows) => {
      const plan = buildEvenPlan(
        toCents(dueTotal) - toCents(downPayment),
        Math.max(rows.length, 1),
        firstDue,
        frequency
      )
      return plan.length > 0 ? plan : rows
    })
  }, [dueTotal, downPayment, firstDue, frequency])

  const setInstalmentAmount = (i: number, amount: number) =>
    setInstalments((rows) => rows.map((r, idx) => (idx === i ? { ...r, amount } : r)))
  const setInstalmentDue = (i: number, dueDate: string) =>
    setInstalments((rows) => rows.map((r, idx) => (idx === i ? { ...r, dueDate } : r)))
  const addInstalment = () =>
    setInstalments((rows) => [...rows, { dueDate: firstDue, amount: 0 }])
  const removeInstalment = (i: number) =>
    setInstalments((rows) => rows.filter((_, idx) => idx !== i))

  const remainingCents = planRemainingCents(
    dueTotal,
    downPayment,
    instalments.map((r) => r.amount)
  )
  const downUnbalanced = isDownPaymentUnbalanced(method, downPayment, splitParts)
  const hasPastDue = instalments.some((r) => isPastDue(r.dueDate))
  const hasZeroPart = instalments.some((r) => toCents(r.amount) <= 0)
  const planValid =
    instalments.length > 0 && remainingCents === 0 && !downUnbalanced && !hasPastDue && !hasZeroPart

  const tenderParts: CreditTenderDto[] = downPaymentParts(method, downPayment, splitParts)
  const instalmentsDto: CreditInstalmentDto[] = instalments.map((r) => ({
    dueDate: r.dueDate,
    amount: r.amount,
  }))

  return {
    downPayment,
    setDownPayment,
    method,
    setMethod,
    splitParts,
    setSplitParts,
    parts,
    setParts,
    firstDue,
    setFirstDue,
    frequency,
    setFrequency,
    applyEven,
    instalments,
    setInstalmentAmount,
    setInstalmentDue,
    addInstalment,
    removeInstalment,
    remainingCents,
    downUnbalanced,
    hasPastDue,
    hasZeroPart,
    planValid,
    tenderParts,
    instalmentsDto,
  }
}
