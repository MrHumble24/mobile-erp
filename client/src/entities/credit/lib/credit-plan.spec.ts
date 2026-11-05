/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import {
  evenSplitCents,
  buildEvenPlan,
  planRemainingCents,
  wouldExceedLimit,
  isPastDue,
} from "./credit-plan.ts"

test("evenSplitCents splits an exact amount evenly", () => {
  assert.deepEqual(evenSplitCents(30000, 3), [10000, 10000, 10000])
})

test("evenSplitCents puts the rounding remainder on the last part", () => {
  // 100.00 over 3 → 33.33, 33.33, 33.34
  assert.deepEqual(evenSplitCents(10000, 3), [3333, 3333, 3334])
})

test("evenSplitCents handles a single part and rejects fewer than one", () => {
  assert.deepEqual(evenSplitCents(12345, 1), [12345])
  assert.deepEqual(evenSplitCents(10000, 0), [])
})

test("evenSplitCents parts always sum back to the total", () => {
  const parts = evenSplitCents(100003, 7)
  assert.equal(parts.reduce((a, b) => a + b, 0), 100003)
})

test("buildEvenPlan dates monthly parts, remainder on the last", () => {
  const plan = buildEvenPlan(10000, 3, "2026-01-31", "month")
  assert.deepEqual(plan.map((p) => p.dueDate), ["2026-01-31", "2026-02-28", "2026-03-31"])
  assert.deepEqual(plan.map((p) => p.amount), [33.33, 33.33, 33.34])
})

test("buildEvenPlan dates weekly parts", () => {
  const plan = buildEvenPlan(30000, 3, "2026-01-01", "week")
  assert.deepEqual(plan.map((p) => p.dueDate), ["2026-01-01", "2026-01-08", "2026-01-15"])
})

test("planRemainingCents is zero when down payment plus parts equal the total", () => {
  assert.equal(planRemainingCents(1000, 400, [300, 300]), 0)
})

test("planRemainingCents is positive when under-planned", () => {
  assert.equal(planRemainingCents(1000, 0, [300]), 70000)
})

test("planRemainingCents is cent-exact with decimal strings", () => {
  assert.equal(planRemainingCents("100.00", "33.33", ["33.33", "33.34"]), 0)
})

test("wouldExceedLimit never blocks when there is no limit", () => {
  assert.equal(wouldExceedLimit(5000, 9999999, null), false)
})

test("wouldExceedLimit adds the existing debt to the new unpaid part", () => {
  assert.equal(wouldExceedLimit(600, 500, 1000), true)
  assert.equal(wouldExceedLimit(600, 400, 1000), false)
})

test("wouldExceedLimit is cent-exact at the boundary", () => {
  assert.equal(wouldExceedLimit("0.00", "1000.01", "1000.00"), true)
  assert.equal(wouldExceedLimit("0.00", "1000.00", "1000.00"), false)
})

test("isPastDue compares in UTC days", () => {
  const now = new Date("2026-06-15T10:00:00.000Z")
  assert.equal(isPastDue("2026-06-14", now), true)
  assert.equal(isPastDue("2026-06-15", now), false)
  assert.equal(isPastDue("2026-06-16", now), false)
})
