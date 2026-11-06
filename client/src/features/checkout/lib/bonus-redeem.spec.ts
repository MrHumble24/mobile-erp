/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { planBonusRedeem } from "./bonus-redeem.ts"

test("uses the requested points when the balance and the line allow it", () => {
  const plan = planBonusRedeem(
    [{ lineId: "a", price: 100000, due: 100000 }],
    5000,
    5000,
    50
  )
  assert.equal(plan.max, 5000)
  assert.equal(plan.total, 5000)
  assert.deepEqual(plan.byLine, { a: 5000 })
  assert.deepEqual(plan.payableLines, [{ lineId: "a", salePrice: 95000 }])
})

test("the percent cap wins over a larger request and balance", () => {
  const plan = planBonusRedeem(
    [{ lineId: "a", price: 100000, due: 100000 }],
    80000,
    200000,
    50
  )
  assert.equal(plan.max, 50000)
  assert.equal(plan.total, 50000)
})

test("shares points in cart order, each line up to its cap", () => {
  const plan = planBonusRedeem(
    [
      { lineId: "a", price: 100000, due: 100000 },
      { lineId: "b", price: 40000, due: 40000 },
    ],
    60000,
    60000,
    50
  )
  assert.deepEqual(plan.byLine, { a: 50000, b: 10000 })
  assert.deepEqual(plan.payableLines, [
    { lineId: "a", salePrice: 50000 },
    { lineId: "b", salePrice: 30000 },
  ])
})

test("a line never takes more than what is left after its trade-in", () => {
  const plan = planBonusRedeem(
    [{ lineId: "a", price: 100000, due: 30000 }],
    90000,
    90000,
    50
  )
  assert.equal(plan.max, 30000)
  assert.equal(plan.total, 30000)
  assert.deepEqual(plan.payableLines, [{ lineId: "a", salePrice: 0 }])
})

test("no balance means no points and the full due stays payable", () => {
  const plan = planBonusRedeem(
    [{ lineId: "a", price: 100000, due: 100000 }],
    5000,
    0,
    50
  )
  assert.equal(plan.max, 0)
  assert.equal(plan.total, 0)
  assert.deepEqual(plan.payableLines, [{ lineId: "a", salePrice: 100000 }])
})

test("a zero percent cap means no points and the full due stays payable", () => {
  const plan = planBonusRedeem(
    [{ lineId: "a", price: 100000, due: 100000 }],
    5000,
    1000,
    0
  )
  assert.equal(plan.max, 0)
  assert.equal(plan.total, 0)
  assert.deepEqual(plan.payableLines, [{ lineId: "a", salePrice: 100000 }])
})

test("rounds the percent cap half up to the cent", () => {
  const plan = planBonusRedeem(
    [{ lineId: "a", price: 333.33, due: 333.33 }],
    1000,
    1000,
    50
  )
  assert.equal(plan.max, 166.67)
})

test("a negative or not-a-number request spends nothing", () => {
  const lines = [{ lineId: "a", price: 100000, due: 100000 }]
  assert.equal(planBonusRedeem(lines, -5, 5000, 50).total, 0)
  assert.equal(planBonusRedeem(lines, Number.NaN, 5000, 50).total, 0)
})
