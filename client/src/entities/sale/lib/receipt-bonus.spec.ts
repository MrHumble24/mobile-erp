/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { receiptBonusLines } from "./receipt-bonus.ts"

const translate = (key: string) => key

test("a sale that spent and earned points shows both receipt lines", () => {
  const lines = receiptBonusLines({ spent: "1000.00", earned: "1450.00" }, translate)
  assert.equal(lines.paidWithPoints?.label, "sales.paidWithPoints")
  assert.equal(lines.paidWithPoints?.amount, "1,000")
  assert.equal(lines.paidWithPoints?.negative, true)
  assert.equal(lines.pointsEarned?.label, "sales.pointsEarned")
  assert.equal(lines.pointsEarned?.amount, "1,450")
  assert.equal(lines.pointsEarned?.negative, false)
})

test("a sale with no points shows neither receipt line", () => {
  const lines = receiptBonusLines({ spent: "0.00", earned: "0.00" }, translate)
  assert.equal(lines.paidWithPoints, null)
  assert.equal(lines.pointsEarned, null)
})
