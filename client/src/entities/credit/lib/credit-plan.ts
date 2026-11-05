/**
 * Pure payment-plan arithmetic for customer credit (ADR 0035). No interest, no
 * fee — only splitting a principal into parts. Money is handled in integer cents
 * so nothing drifts through floats, mirroring the server's Decimal maths.
 */

import type { CreditInstalmentDto } from "../model/credit.types"

/** Major-unit money → integer cents (2-dp, half-up). Local to avoid an entity→entity import. */
export function toCents(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0
  return Math.round(Number(value) * 100)
}

/** Integer cents → a major-unit number. */
export function fromCents(cents: number): number {
  return cents / 100
}

export type PlanFrequency = "month" | "week"

/**
 * Split `totalCents` into `parts` positive amounts (cents), as even as possible,
 * with the rounding remainder landing on the LAST part. `parts < 1` → empty.
 */
export function evenSplitCents(totalCents: number, parts: number): number[] {
  if (parts < 1 || totalCents < 0) return []
  const base = Math.floor(totalCents / parts)
  const result = Array.from({ length: parts }, () => base)
  result[parts - 1] = totalCents - base * (parts - 1)
  return result
}

/** Midnight UTC of a Date — DATE instalments live at 00:00 UTC server-side. */
export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** A Date → `YYYY-MM-DD` in UTC, the shape an `<input type="date">` and the API use. */
export function toDateInput(d: Date): string {
  return startOfUtcDay(d).toISOString().slice(0, 10)
}

/** Add months in UTC, clamping the day to the target month's last day. */
function addMonthsUtc(d: Date, n: number): Date {
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + n
  const day = d.getUTCDate()
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)))
}

/** Add whole weeks in UTC. */
function addWeeksUtc(d: Date, n: number): Date {
  return new Date(startOfUtcDay(d).getTime() + n * 7 * 86_400_000)
}

/**
 * An even plan: `amountCents` split across `parts`, the first due on `firstDue`
 * (ISO `YYYY-MM-DD`), each following part one month or one week later. The
 * remainder rides the last part. Returns the DTO the API expects.
 */
export function buildEvenPlan(
  amountCents: number,
  parts: number,
  firstDue: string,
  every: PlanFrequency
): CreditInstalmentDto[] {
  const amounts = evenSplitCents(amountCents, parts)
  const first = new Date(`${firstDue}T00:00:00.000Z`)
  if (Number.isNaN(first.getTime())) return []
  return amounts.map((cents, i) => ({
    dueDate: toDateInput(every === "month" ? addMonthsUtc(first, i) : addWeeksUtc(first, i)),
    amount: fromCents(cents),
  }))
}

/**
 * What is still unplanned, in cents: cart total − down payment − Σ instalments.
 * Zero means the plan balances; the till blocks checkout until it is zero.
 */
export function planRemainingCents(
  cartTotal: string | number,
  downPayment: string | number,
  instalmentAmounts: Array<string | number>
): number {
  const planned = instalmentAmounts.reduce<number>((sum, a) => sum + toCents(a), 0)
  return toCents(cartTotal) - toCents(downPayment) - planned
}

/**
 * True when selling this credit would push the customer's owed principal past
 * their effective limit. `newUnpaid` is the cart total minus the down payment
 * (= Σ instalments). A null limit is no cap — there is never any interest.
 */
export function wouldExceedLimit(
  currentOutstanding: string | number,
  newUnpaid: string | number,
  limit: string | number | null
): boolean {
  if (limit === null || limit === undefined || limit === "") return false
  return toCents(currentOutstanding) + toCents(newUnpaid) > toCents(limit)
}

/** True when a due date (ISO `YYYY-MM-DD`) is before today, in UTC days. */
export function isPastDue(dueDate: string, now: Date = new Date()): boolean {
  const due = new Date(`${dueDate}T00:00:00.000Z`)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() < startOfUtcDay(now).getTime()
}
