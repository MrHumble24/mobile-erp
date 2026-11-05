/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import {
  discountAmountCents,
  discountCapPercent,
  discountError,
  finalPriceCents,
  levelPriceCents,
} from "./discount.ts"
import type { DiscountRules } from "./discount.ts"

const rules = (over: Partial<DiscountRules> = {}): DiscountRules => ({
  enabled: true,
  percentAllowed: true,
  amountAllowed: true,
  maxPercent: 5,
  standingPercent: 0,
  unlimited: false,
  ...over,
})

test("levelPriceCents resolves the line price per level", () => {
  const prices = { RETAIL: "700000.00", WHOLESALE: "650000.00", PARTNER: null }
  assert.equal(levelPriceCents(prices, "RETAIL"), 70000000)
  assert.equal(levelPriceCents(prices, "WHOLESALE"), 65000000)
  assert.equal(levelPriceCents(prices, "PARTNER"), null)
  assert.equal(levelPriceCents(null, "RETAIL"), null)
})

test("percent discount rounds half-up like the server", () => {
  // 5% of 700_000 = 35_000
  assert.equal(discountAmountCents(70000000, { mode: "PERCENT", value: 5 }), 3500000)
  // 3% of 333.33 (33333 cents) = 999.99 cents → round 1000
  assert.equal(discountAmountCents(33333, { mode: "PERCENT", value: 3 }), 1000)
  assert.equal(finalPriceCents(70000000, { mode: "PERCENT", value: 5 }), 66500000)
})

test("amount discount is the whole-line sum in cents", () => {
  assert.equal(discountAmountCents(70000000, { mode: "AMOUNT", value: 100000 }), 10000000)
  assert.equal(finalPriceCents(70000000, { mode: "AMOUNT", value: 100000 }), 60000000)
})

test("cashier limit blocks an over-cap percent; the standing discount raises it", () => {
  const list = 70000000
  // 10% over the 5% cashier cap
  assert.equal(discountError(list, { mode: "PERCENT", value: 10 }, rules()), "errorDiscountTooHigh")
  assert.equal(discountCapPercent(rules()), 5)
  // a customer standing at 10% raises the cap, so 10% is now allowed
  const raised = rules({ standingPercent: 10 })
  assert.equal(discountCapPercent(raised), 10)
  assert.equal(discountError(list, { mode: "PERCENT", value: 10 }, raised), null)
  // 5% stays within the plain cashier cap
  assert.equal(discountError(list, { mode: "PERCENT", value: 5 }, rules()), null)
})

test("an amount discount above the list price is rejected", () => {
  assert.equal(
    discountError(70000000, { mode: "AMOUNT", value: 800000 }, rules({ unlimited: true })),
    "errorDiscountAboveList"
  )
})

test("discounts off rejects any discount; unlimited bypasses the cap", () => {
  assert.equal(
    discountError(70000000, { mode: "PERCENT", value: 3 }, rules({ enabled: false })),
    "errorDiscountDisabled"
  )
  assert.equal(
    discountError(70000000, { mode: "PERCENT", value: 50 }, rules({ unlimited: true })),
    null
  )
})
